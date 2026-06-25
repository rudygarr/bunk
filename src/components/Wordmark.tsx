// The CampHQ wordmark — "Camp" in the current text color, "HQ" in the amber
// accent. Inherits font-size/family from whatever element wraps it, so it works
// at any scale (topbar, login splash, public pages).
export default function Wordmark() {
  return <>Camp<span className="wm-hq">HQ</span></>;
}
