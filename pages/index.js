import Head from "next/head";
import { Inter } from "@next/font/google";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import {
  getRenderedPumpOffDatetimeString,
  getRenderedTemplate,
  getSwitchState,
  setPumpOffTime,
  turnOffPump,
} from "../api";
import { invalidateQueries, queryClient } from "./_app";

const inter = Inter({ subsets: ["latin"] });
const minutesAdd = 10;

export default function Home() {
  const [localPumpEnabled, setLocalPumpEnabled] = useState(false);
  const {
    data: switchStateData,
    status: switchStateStatus,
    refetch: refetchSwitchState,
    isLoading: switchStateIsLoading,
    isStale: switchStateIsStale,
  } = useQuery({
    queryKey: "switchState",
    queryFn: getSwitchState,
    refetchInterval: 3000,
  });

  const pumpEnabled = switchStateData?.state === "on";

  useEffect(() => {
    console.log("load");
  }, []);

  useEffect(() => {
    console.log("switchData Change", switchStateData);
    if (switchStateData?.state) {
      setLocalPumpEnabled(switchStateData?.state === "on");
    }
  }, [switchStateData]);

  const handleActivate = () => {
    console.log("activate pump");
    refetchSwitchState().then((res) => {
      console.log(res);
      if (res?.data?.state === "off") {
        console.log("pump is currently off.");
        // if not already on, update pump_off_datetime to "now() + 10 minutes"
        getRenderedTemplate(`{{ now() + timedelta( minutes = 10 ) }}`).then(
          (timeString) => {
            console.log("updating pump_off_datetime to ", timeString);
            setPumpOffTime(timeString).then((res) => {
              console.log("setPumpOffTime > ", res);
              setLocalPumpEnabled(true);
            });
            console.log("pump should now be on.");
          }
        );
      }
    });
    console.log("switchStateIsLoading");
  };

  const handleDeactivate = () => {
    if (pumpEnabled) {
      console.log("off");
      turnOffPump().finally(() => {
        console.log("turned it off");
        setLocalPumpEnabled(false);
      });
    }
  };

  return (
    <>
      <Head>
        <title>Water Pump Switch</title>
        <meta
          name="description"
          content="turn water pump switch on or off with a timer"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`container ${localPumpEnabled ? "pump-on" : "pump-off"}`}>
        <main>
          <div>
            {/* <div>pumpstring: {pumpStringData}</div> */}
            <div>switchStateData: {pumpEnabled ? "on" : "off"}</div>
            <div>localPumpEnabled: {localPumpEnabled ? "on" : "off"}</div>
            <div>
              switchStateIsLoading: {switchStateIsLoading ? "yes" : "no"}
            </div>
            <div>switchStateIsStale: {switchStateIsStale ? "yes" : "noi"}</div>
          </div>
          <div className="timer">timer</div>
          <div className="controls">
            <button onClick={handleActivate}>turn it on baby</button>
            <button
              disabled={!pumpEnabled || !localPumpEnabled}
              onClick={handleDeactivate}
            >
              turn it off
            </button>
          </div>
        </main>
      </div>
      <style jsx>
        {`
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            background: var(--background-off-rgb);
          }
          .pump-off {
            background: var(--background-off-rgb);
          }
          .pump-on {
            background: var(--background-on-rgb);
          }
          main {
          }
          .controls {
            display: flex;
            flex-direction: column;
          }
        `}
      </style>
    </>
  );
}
