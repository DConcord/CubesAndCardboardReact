import { useState, createContext, useContext } from "react";

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);
type LoggingContextType = ReturnType<typeof _loggingContext>;

/** React hook that provides convenient access to the Logging lib's features */
export default function loggingContext() {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error("The LoggingContextProvider must be added above this consumer in the React component tree");
  }
  return context;
}

export const LoggingContextProvider = (props: { children: React.ReactNode }) => {
  return <LoggingContext.Provider value={_loggingContext()}>{props.children}</LoggingContext.Provider>;
};

function _loggingContext() {
  const [customTimeRange, setCustomTimeRange] = useState(false);
  const [startInterval, setStartInterval] = useState(1);
  const [startIntervalType, setStartIntervalType] = useState<IntervalType>("Days");
  const [startTime, setStartTime] = useState<string>(String(Date.now() - 24 * 60 * 60 * 1000).slice(0, 10)); // 1 day ago
  const [endTime, setEndTime] = useState<string | null>(null);

  return {
    customTimeRange,
    setCustomTimeRange,
    startInterval,
    setStartInterval,
    startIntervalType,
    setStartIntervalType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
  };
}

export type IntervalType = "Minutes" | "Hours" | "Days" | "Weeks";
