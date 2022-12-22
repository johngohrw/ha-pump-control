import Head from "next/head";
import { Inter } from "@next/font/google";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import {
  apiEndpoint,
  getPumpOffDatetimeState,
  getRenderedTemplate,
  getSwitchState,
  setPumpOffTime as setPumpOffTimeApi,
  switchEntityID,
  turnOffPump,
} from "../api";

const inter = Inter({ subsets: ["latin"] });
let defaultTimerValue = "00:00";

export default function Switch() {
  const [showDebug, setShowDebug] = useState(false);
  const [initialIsLoading, setInitialIsLoading] = useState(true);
  const [initialLoadMessage, setInitialLoadMessage] = useState(
    "Connecting to pump controller..."
  );
  const [initialLoadErrorMessage, setInitialLoadErrorMessage] = useState("");
  const [isLoadingPostInteract, setIsLoadingPostInteract] = useState(false);

  // local state. does not 100% reflect actual pump state.
  const [pumpEnabled, setPumpEnabled] = useState(false);

  // local state. does not 100% reflect actual pump off time.
  const [pumpOffTime, setPumpOffTime] = useState(new Date());

  // local state. does not 100% reflect actual timer value.
  const [timerString, setTimerString] = useState(defaultTimerValue);

  // switch state api
  const { data: switchStateData } = useQuery({
    queryKey: "switchState",
    queryFn: getSwitchState,
    refetchInterval: 3000,
  });

  // pump off datetime api
  const { data: pumpOffDatetimeData } = useQuery({
    queryKey: "pumpOffDatetime",
    queryFn: getPumpOffDatetimeState,
    refetchInterval: 3000,
  });

  // get current pumpEnabled state from server. runs on initial api load.
  useEffect(() => {
    console.log("switchStateChange > ", switchStateData);
    if (switchStateData?.state === "unavailable") {
      setInitialLoadMessage("Connected to pump controller.");
      setInitialLoadErrorMessage("Cannot connect to pump switch.");
    }
    if (switchStateData?.state) {
      setInitialIsLoading(false);
      setPumpEnabled(switchStateData?.state === "on");
    }
  }, [switchStateData]);

  // get current pumpOffTime from server. runs on initial api load.
  useEffect(() => {
    if (pumpOffDatetimeData?.state) {
      if (isDate(pumpOffDatetimeData?.state)) {
        setPumpOffTime(new Date(pumpOffDatetimeData?.state));
      } else {
        console.error(
          "Failed to fetch a valid pumpOffDatetime state. Returned data:",
          pumpOffDatetimeData
        );
      }
    }
  }, [pumpOffDatetimeData]);

  // timer update loop based on pumpOffTime.
  useEffect(() => {
    const timerUpdate = setInterval(() => {
      const diffTime = pumpOffTime - new Date();
      if (diffTime <= 0) {
        clearInterval(timerUpdate);
      } else {
        let hours = `${Math.floor(diffTime / 1000 / 60 / 60)}`;
        let minutes = `${Math.floor((diffTime / 1000 / 60) % 60)}`;
        let seconds = `${Math.floor((diffTime / 1000) % 60)}`;
        setTimerString(
          `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
        );
      }
    }, 100);

    return () => clearInterval(timerUpdate);
  }, [pumpOffTime]);

  function handlePumpStateChange(newPumpState) {
    setIsLoadingPostInteract(true);
    // do api calls
    if (newPumpState) {
      // turn on pump & update pump off time to now + 10min
      console.log("getting template rendering for now() + 10 mins..");
      getRenderedTemplate(`{{ now() + timedelta( minutes = 10 ) }}`).then(
        (timeString) => {
          console.log(
            "template rendered. Updating pump_off_datetime to",
            timeString
          );
          setPumpOffTimeApi(timeString).then((res) => {
            console.log(
              "Pump is now on. Confirmed pump off time:",
              res[0].state
            );
            if (isDate(res[0].state)) {
              console.log(
                res[0].state,
                "is a date! updating local pumpOffTime."
              );
              setPumpOffTime(new Date(res[0].state));
            }
            setPumpEnabled(true);
            setIsLoadingPostInteract(false);
          });
        }
      );
    } else {
      // turn off pump
      turnOffPump().then((res) => {
        console.log("pump turned off.", res);
        setPumpEnabled(false);
        setIsLoadingPostInteract(false);
      });
    }
  }

  function handleTimeAddition() {
    setIsLoadingPostInteract(true);

    console.log("Adding 10 minutes to current pumpOffTime:", pumpOffTime);
    if (pumpEnabled && isDate(pumpOffTime)) {
      const currDate = new Date(pumpOffTime);
      const minutes = 10;
      let newTime = new Date(
        currDate.setMinutes(currDate.getMinutes() + minutes)
      );
      let YYYY = newTime.getFullYear().toString().padStart(2, "0");
      let MM = (newTime.getMonth() + 1).toString().padStart(2, "0");
      let DD = newTime.getDate().toString().padStart(2, "0");
      let hh = newTime.getHours().toString().padStart(2, "0");
      let mm = newTime.getMinutes().toString().padStart(2, "0");
      let ss = newTime.getSeconds().toString().padStart(2, "0");

      newTime = `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
      console.log("newtime > ", newTime);

      getRenderedTemplate(`{{ as_datetime("${newTime}") }}`).then(
        (timeString) => {
          console.log(
            "template rendered. Updating pump_off_datetime to",
            timeString
          );
          setPumpOffTimeApi(timeString).then((res) => {
            console.log("Time added. Confirmed pump off time:", res[0].state);
            if (isDate(res[0].state)) {
              console.log(
                res[0].state,
                "is a date! updating local pumpOffTime."
              );
              setPumpOffTime(new Date(res[0].state));
            }
            setPumpEnabled(true);
            setIsLoadingPostInteract(false);
          });
        }
      );
    } else {
      const errorMsg = `Cannot add time. Pump is currently off or pumpOffTime (${pumpOffTime}) is not a valid date`;
      console.error(errorMsg);
      alert(errorMsg);
      setIsLoadingPostInteract(true);
    }
  }

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
      <div className={`container ${pumpEnabled && "enabled"}`}>
        <main className={inter.className}>
          {initialIsLoading || initialLoadErrorMessage ? (
            <InitialLoadContent
              initialLoadMessage={initialLoadMessage}
              errorMessage={initialLoadErrorMessage}
            />
          ) : (
            <>
              <div className="statusText">
                Pump is now{" "}
                <span
                  className="statusTextInner"
                  style={{ color: pumpEnabled ? "green" : "red" }}
                >
                  {pumpEnabled ? "ON" : "OFF"}
                </span>
                {pumpEnabled && " and will turn off in:"}
              </div>
              {pumpEnabled && <div className="timer">{timerString}</div>}

              {pumpEnabled &&
                isDate(pumpOffTime) &&
                new Date(pumpOffTime) > new Date() && (
                  <div style={{ marginBottom: "1rem" }}>
                    ({new Date(pumpOffTime).toLocaleString()})
                  </div>
                )}

              <div className="controls">
                <HugeAssToggle
                  checked={pumpEnabled}
                  onChange={(e) => handlePumpStateChange(e.target.checked)}
                  disabled={isLoadingPostInteract}
                  borderWidth={0}
                  innerSpacing={16}
                  uncheckedColor="#9d4343"
                  checkedColor="#39ab39"
                />
                {pumpEnabled && (
                  <HugeAssButton
                    onClick={handleTimeAddition}
                    disabled={isLoadingPostInteract}
                    style={{ marginTop: "2rem" }}
                  >
                    Add 10 minutes
                  </HugeAssButton>
                )}
              </div>
              <button
                className="debugButton"
                onClick={() => setShowDebug(!showDebug)}
              >
                Debug panel
              </button>
              <div className={`debugPanel ${showDebug && "shown"}`}>
                <div>Switch EntityID: {switchEntityID}</div>
                <div>API endpoint: {apiEndpoint}</div>
                <div>pumpEnabled (local): {pumpEnabled ? "Y" : "N"}</div>
                <div>pumpOffTime(local): {pumpOffTime.toString()}</div>
                <div>
                  isLoadingPostInteract: {isLoadingPostInteract ? "Y" : "N"}
                </div>
                <div>initialIsLoading: {initialIsLoading ? "Y" : "N"}</div>
                <div>initialLoadMessage: {initialLoadMessage}</div>
                <div>initialLoadErrorMessage: {initialLoadErrorMessage}</div>
                <div>timerString (local): {timerString}</div>
                <div>switchStateData: {switchStateData?.state}</div>
                <div>pumpOffDatetimeData: {pumpOffDatetimeData?.state}</div>
              </div>
            </>
          )}
        </main>
      </div>
      <style jsx>
        {`
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            background: #cbcbcb;
            transition-duration: 500ms;
          }
          .container.enabled {
            background: #a9d5f1;
          }
          main {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            height: 100%;
            width: 100%;
            max-width: 1000px;

            flex-grow: 1;
          }

          .statusText {
            font-size: 18px;
            margin-bottom: 1rem;
          }
          .statusTextInner {
            font-weight: 800;
            font-size: 24px;
            margin: 0 0.25rem;
          }
          .timer {
            margin-bottom: 1rem;
            font-size: 4rem;
            font-weight: 700;
          }
          .controls {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .debugButton {
            position: absolute;
            bottom: 0;
            left: 0;
            background: blue;
            color: white;
            padding: 0.2rem;
            cursor: pointer;
          }
          .debugPanel {
            border: 1px solid grey;
            border-radius: 24px;
            margin-top: 2rem;
            padding: 1.5rem;
            display: none;
          }
          .debugPanel.shown {
            display: block;
          }
        `}
      </style>
    </>
  );
}

const InitialLoadContent = ({ initialLoadMessage, errorMessage }) => {
  return (
    <>
      <div className="container">
        <div className="loadState">{initialLoadMessage}</div>
        {errorMessage && <div className="errorMessage">{errorMessage}</div>}
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 2rem;
          font-size: 2rem;
          font-weight: 800;
        }
        .loadState {
          color: #282828;
        }
        .errorMessage {
          margin-top: 1rem;
          color: red;
        }
      `}</style>
    </>
  );
};

var isDate = function (date) {
  return new Date(date) !== "Invalid Date" && !isNaN(new Date(date));
};

const HugeAssToggle = ({
  borderWidth = 6,
  innerSpacing = 4,
  checkedColor = "#39ab39",
  uncheckedColor = "#bb4747",
  width: containerWidth = 170,
  height: containerHeight = 70,
  disabled,
  checked,
  ...rest
}) => {
  const checkboxRef = useRef();

  const handleToggle = () => {
    checkboxRef?.current?.click();
  };
  return (
    <>
      <div
        type="button"
        className={`toggleContainer ${checked && "checked"} ${
          disabled && "disabled"
        }`}
        onClick={handleToggle}
      >
        <div
          className={`toggleCircle ${checked && "checked"} ${
            disabled && "disabled"
          }`}
        />
      </div>
      <input
        hidden
        type="checkbox"
        ref={checkboxRef}
        checked={checked}
        disabled={disabled}
        {...rest}
      />
      <style jsx>{`
        .toggleContainer {
          position: relative;
          height: ${containerHeight}px;
          width: ${containerWidth}px;
          border: ${borderWidth}px solid black;
          background: ${uncheckedColor};
          border-radius: 100px;
          cursor: pointer;
          transition-duration: 200ms;
        }
        .toggleContainer.checked {
          background: ${checkedColor};
        }
        .toggleContainer.disabled {
          background: #999999;
          border-color: #525252;
          cursor: not-allowed;
        }
        .toggleCircle {
          position: absolute;
          border-radius: 100px;
          height: calc(100% - ${innerSpacing}px);
          margin: ${innerSpacing / 2}px;
          aspect-ratio: 1;
          border: ${borderWidth}px solid black;
          background: white;
          transition-duration: 200ms;
        }
        .toggleCircle.disabled {
          background: #b9b9b9;
          border-color: #525252;
        }

        .toggleCircle.checked {
          transform: translateX(${containerWidth - containerHeight}px);
        }
      `}</style>
    </>
  );
};

const HugeAssButton = ({ borderWidth = 0, ...rest }) => {
  return (
    <>
      <button {...rest} style={{ ...rest.style, ...inter.style }}>
        {rest.children}
      </button>
      <style jsx>{`
        button {
          color: white;
          font-size: 1.5rem;
          font-weight: 800;
          padding: 0.8rem 1.5rem;
          border: ${borderWidth}px solid;
          border-radius: 100px;
          transition-duration: 200ms;
          background: #013e7c;
          cursor: pointer;
        }
        button:disabled {
          color: #ddd;
          background: #979797;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};
