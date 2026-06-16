#!/usr/bin/env python3
"""
Forest Data Partnership (model_2025b) coffee screening worker for Tracebud.

Exposes POST /screen — samples FDP coffee probability layers in Earth Engine
for plot polygons in Nigeria, Rwanda, and Tanzania pilot geographies.

Requires:
  pip install -r requirements.txt
  earthengine authenticate   # or GOOGLE_APPLICATION_CREDENTIALS for a service account

Run:
  uvicorn main:app --host 0.0.0.0 --port 8095
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import ee
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL_VERSION = "2025b"
PILOT_COMMODITIES = {"coffee"}
COMPETING_COMMODITIES = ("cocoa", "palm", "rubber")
EE_COLLECTION_TEMPLATE = "projects/forestdatapartnership/assets/{commodity}/model_{version}"

app = FastAPI(title="Tracebud FDP Screening Worker", version="0.1.0")
_ee_initialized = False


def ensure_ee() -> None:
    global _ee_initialized
    if _ee_initialized:
        return
    project = os.environ.get("EE_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    if project:
        ee.Initialize(project=project)
    else:
        ee.Initialize()
    _ee_initialized = True


class ScreenRequest(BaseModel):
    geometry: dict[str, Any]
    commodity: str = "coffee"
    countryCode: str | None = None
    years: list[int] = Field(default_factory=lambda: [2019, 2020, 2021])
    modelVersion: str = MODEL_VERSION


class YearStats(BaseModel):
    mean: float | None = None
    p50: float | None = None
    p90: float | None = None


class LayerResult(BaseModel):
    commodity: str
    year: int
    dataset: str
    ok: bool
    error: str | None = None


def collection_id(commodity: str, version: str = MODEL_VERSION) -> str:
    return EE_COLLECTION_TEMPLATE.format(commodity=commodity, version=version)


def year_image(commodity: str, year: int, version: str = MODEL_VERSION) -> ee.Image:
    collection = ee.ImageCollection(collection_id(commodity, version))
    start = f"{year}-01-01"
    end = f"{year}-12-31"
    image = collection.filterDate(start, end).sort("system:time_start", False).first()
    return ee.Image(image).select("probability")


def reduce_probability(image: ee.Image, geometry: ee.Geometry) -> dict[str, float | None]:
    stats = image.reduceRegion(
        reducer=ee.Reducer.mean()
        .combine(ee.Reducer.percentile([50, 90]), sharedInputs=True),
        geometry=geometry,
        scale=10,
        maxPixels=int(1e9),
        bestEffort=True,
    )
    result = stats.getInfo() or {}

    def pick(*keys: str) -> float | None:
        for key in keys:
            value = result.get(key)
            if isinstance(value, (int, float)):
                return float(value)
        return None

    return {
        "mean": pick("probability_mean", "mean"),
        "p50": pick("probability_p50", "p50"),
        "p90": pick("probability_p90", "p90"),
    }


def screen_geometry(
    geometry_geojson: dict[str, Any],
    commodity: str,
    years: list[int],
    version: str = MODEL_VERSION,
) -> dict[str, Any]:
    ensure_ee()
    commodity = commodity.strip().lower()
    if commodity not in PILOT_COMMODITIES:
        raise HTTPException(status_code=400, detail=f"Unsupported commodity: {commodity}")

    geometry = ee.Geometry(geometry_geojson)
    years_out: dict[str, YearStats] = {}
    layers: list[LayerResult] = []

    for year in years:
        dataset = collection_id(commodity, version)
        try:
            image = year_image(commodity, year, version)
            stats = reduce_probability(image, geometry)
            years_out[str(year)] = YearStats(**stats)
            layers.append(
                LayerResult(commodity=commodity, year=year, dataset=dataset, ok=True)
            )
        except Exception as exc:  # noqa: BLE001 — surface EE failures per layer
            years_out[str(year)] = YearStats()
            layers.append(
                LayerResult(
                    commodity=commodity,
                    year=year,
                    dataset=dataset,
                    ok=False,
                    error=str(exc),
                )
            )

    baseline_year = 2020
    competing_commodity: str | None = None
    competing_prob_mean: float | None = None

    try:
        best_name: str | None = None
        best_mean = -1.0
        for candidate in COMPETING_COMMODITIES:
            image = year_image(candidate, baseline_year, version)
            stats = reduce_probability(image, geometry)
            mean = stats.get("mean")
            if mean is not None and mean > best_mean:
                best_mean = mean
                best_name = candidate
        if best_name is not None and best_mean >= 0:
            competing_commodity = best_name
            competing_prob_mean = best_mean if best_mean > 0 else None
    except Exception:
        competing_commodity = None
        competing_prob_mean = None

    return {
        "ok": any(layer.ok for layer in layers),
        "modelVersion": version,
        "commodity": commodity,
        "years": {year: stats.model_dump() for year, stats in years_out.items()},
        "competingCommodity": competing_commodity,
        "competingProbMean": competing_prob_mean,
        "layers": [layer.model_dump() for layer in layers],
        "queriedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "modelVersion": MODEL_VERSION}


@app.post("/screen")
def screen(request: ScreenRequest) -> dict[str, Any]:
    if not request.geometry:
        raise HTTPException(status_code=400, detail="geometry is required")

    payload = screen_geometry(
        geometry_geojson=request.geometry,
        commodity=request.commodity,
        years=request.years,
        version=request.modelVersion,
    )
    payload["countryCode"] = request.countryCode
    return payload


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8095"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
