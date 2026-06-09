---
title: TRACES NT workflow overview for exporters
description: Filing to the EU system is not a JSON API call. Understand the middleware, security headers, and pre-flight checks Tracebud runs before submission.
category: playbooks
tags: traces-nt, exporters, filing
locale: en
publishedAt: 2026-04-01
author: Tracebud Team
draft: false
---

## Not a REST endpoint

TRACES NT expects verbose SOAP/XML payloads with WS-Security authentication. Tracebud translates structured internal records into compliant filing packages.

## Pre-flight before unlock

A zero-risk pre-flight check runs across the full batch pool. If any plot in the pool fails stringent review, submission stays locked — reducing declaration-in-excess liability.

## Polygon chunking

Complex geometries may exceed size or vertex limits. Middleware splits and reconciles references so filings remain valid without manual rework.
