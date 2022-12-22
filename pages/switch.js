import Head from "next/head";
import { Inter } from "@next/font/google";
import { useEffect, useRef, useState } from "react";

const inter = Inter({ subsets: ["latin"] });
let defaultTimerValue = "00:00";

export default function Switch() {
  const [initialIsLoading, setInitialIsLoading] = useState(false);
  const [initialLoadErrorMessage, setInitialLoadErrorMessage] = useState("");
  const [isLoadingPostInteract, setIsLoadingPostInteract] = useState(false);

  // local state. does not 100% reflect actual pump state.
  const [pumpEnabled, setPumpEnabled] = useState(true);

  const [testState, setTestState] = useState(false);

  // local state. does not 100% reflect actual pump off time.
  const [pumpOffTime, setPumpOffTime] = useState(new Date());

  // local state. does not 100% reflect actual timer value.
  const [timerString, setTimerString] = useState(defaultTimerValue);

  // timer update loop based on pumpOffTime.
  useEffect(() => {
    const timerUpdate = setInterval(() => {
      const diffTime = pumpOffTime - new Date();
      if (diffTime <= 0) {
        clearInterval(timerUpdate);
      } else {
        let minutes = `${Math.floor(diffTime / 1000 / 60)}`;
        let seconds = `${Math.floor((diffTime / 1000) % 60)}`;
        setTimerString(
          `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
        );
      }
    }, 100);

    return () => clearInterval(timerUpdate);
  }, [pumpOffTime]);

  // local add minutes function
  function localAddMinutes(minutes) {
    setPumpOffTime((prevState) => {
      let currDate = new Date(prevState);
      return currDate.setMinutes(currDate.getMinutes() + minutes);
    });
  }

  function handlePumpStateChange(newState) {
    setIsLoadingPostInteract(true);
    console.log("pump new state >", newState);

    // do api calls

    setTimeout(() => {
      setPumpEnabled(!pumpEnabled);
      setIsLoadingPostInteract(false);
    }, 1000);
  }

  function handleTimeAddition() {
    setIsLoadingPostInteract(true);

    // do api calls
    setTimeout(() => {
      setIsLoadingPostInteract(false);
    }, 1000);
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
          {initialIsLoading ? (
            <InitialLoadContent
              initialLoadMessage="Connecting to pump..."
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

              {isDate(pumpOffTime) && new Date(pumpOffTime) > new Date() && (
                <div>({new Date(pumpOffTime).toLocaleString()})</div>
              )}

              <div className="controls">
                <HugeAssToggle
                  checked={pumpEnabled}
                  onChange={(e) => handlePumpStateChange(e.target.checked)}
                  disabled={isLoadingPostInteract}
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
            border: 1px solid black;
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
        `}
      </style>
    </>
  );
}

const InitialLoadContent = ({ initialLoadMessage, errorMessage }) => {
  const [loadState, setLoadState] = useState(initialLoadMessage);
  return (
    <>
      <div className="container">
        <div className="loadState">{loadState}</div>
        {errorMessage && <div className="errorMessage">{errorMessage}</div>}
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 2rem;
          font-size: 2rem;
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
          background: #d79f9f;
          border-radius: 100px;
          cursor: pointer;
          transition-duration: 200ms;
        }
        .toggleContainer.checked {
          background: #39ab39;
        }
        .toggleContainer.disabled {
          background: #999999;
          border-color: #525252;
          cursor: not-allowed;
        }
        .toggleCircle {
          position: absolute;
          border-radius: 100px;
          height: calc(100% - 4px);
          margin: 2px;
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
      {/* {JSON.stringify(inter.style)} */}
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
