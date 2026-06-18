/* eslint-disable */
import * as Router from "expo-router";

export * from "expo-router";

declare module "expo-router" {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/compose`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(auth)"}/sign-in` | `/sign-in`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/calendar` | `/calendar`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/inbox` | `/inbox`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/settings` | `/settings`; params?: Router.UnknownInputParams }
        | { pathname: `/event/new`; params?: Router.UnknownInputParams }
        | { pathname: `/email/[id]`; params: Router.UnknownInputParams & { id: string | number } }
        | { pathname: `/event/[id]`; params: Router.UnknownInputParams & { id: string | number } };
      hrefOutputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | { pathname: `/compose`; params?: Router.UnknownOutputParams }
        | { pathname: `/`; params?: Router.UnknownOutputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(auth)"}/sign-in` | `/sign-in`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(tabs)"}/calendar` | `/calendar`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(tabs)"}/inbox` | `/inbox`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(tabs)"}` | `/`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(tabs)"}/settings` | `/settings`; params?: Router.UnknownOutputParams }
        | { pathname: `/event/new`; params?: Router.UnknownOutputParams }
        | { pathname: `/email/[id]`; params: Router.UnknownOutputParams & { id: string } }
        | { pathname: `/event/[id]`; params: Router.UnknownOutputParams & { id: string } };
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | `/compose${`?${string}` | `#${string}` | ""}`
        | `/${`?${string}` | `#${string}` | ""}`
        | `/_sitemap${`?${string}` | `#${string}` | ""}`
        | `${"/(auth)"}/sign-in${`?${string}` | `#${string}` | ""}`
        | `/sign-in${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/calendar${`?${string}` | `#${string}` | ""}`
        | `/calendar${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/inbox${`?${string}` | `#${string}` | ""}`
        | `/inbox${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}${`?${string}` | `#${string}` | ""}`
        | `/${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/settings${`?${string}` | `#${string}` | ""}`
        | `/settings${`?${string}` | `#${string}` | ""}`
        | `/event/new${`?${string}` | `#${string}` | ""}`
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/compose`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(auth)"}/sign-in` | `/sign-in`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/calendar` | `/calendar`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/inbox` | `/inbox`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(tabs)"}/settings` | `/settings`; params?: Router.UnknownInputParams }
        | { pathname: `/event/new`; params?: Router.UnknownInputParams }
        | `/email/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ""}`
        | `/event/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ""}`
        | { pathname: `/email/[id]`; params: Router.UnknownInputParams & { id: string | number } }
        | { pathname: `/event/[id]`; params: Router.UnknownInputParams & { id: string | number } };
    }
  }
}
