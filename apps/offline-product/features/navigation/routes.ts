import type { Href } from 'expo-router';

/** Home tab — use instead of `/` or `/(tabs)/index` (those often hit Unmatched Route). */
export const HOME_TAB_HREF = '/(tabs)' as Href;

type RouterLike = {
  navigate: (href: Href) => void;
  replace: (href: Href) => void;
  back: () => void;
  canGoBack?: () => boolean;
};

export function navigateHome(router: RouterLike) {
  router.navigate(HOME_TAB_HREF);
}

export function replaceHome(router: RouterLike) {
  router.replace(HOME_TAB_HREF);
}

/** Pop stack when possible; otherwise open the home tab. */
export function goBackOrHome(router: RouterLike) {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  navigateHome(router);
}
