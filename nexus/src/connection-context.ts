import { useEnv } from "./env";

export function beaconConnectionContext() {
  let authenticated = false;

  const validateKey = (message: string) => {
    const { APP_KEY } = useEnv();
    if (message === APP_KEY) {
      authenticated = true;
    }
    return authenticated;
  };

  const isAuthenticated = () => authenticated;
  return { validateKey, isAuthenticated };
}
