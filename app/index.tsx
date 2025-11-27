import { Redirect } from "expo-router";

// Redirect root to the tabs entry screen.
export default function RootIndex() {
  return <Redirect href="/tabs" />;
}
