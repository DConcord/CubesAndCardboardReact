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
  const [startIntervalType, setStartIntervalType] = useState<IntervalType>("Hours");
  const [startTime, setStartTime] = useState<string>(String(Date.now() - 60 * 60 * 1000).slice(0, 10)); // 1hr ago
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
  // const [tokens, setTokens] = useState();
  // const [tokensParsed, setTokensParsed] = useState<{
  //   idToken: {
  //     given_name: string;
  //     family_name: string;
  //   }; //CognitoIdTokenPayload;
  //   // accessToken: CognitoAccessTokenPayload;
  //   // expireAt: Date;
  // }>();

  // // Determine sign-in status
  // const signInStatus = useMemo(() => {
  //   return tokensParsed ? ("SIGNED_IN" as const) : ("NOT_SIGNED_IN" as const);
  // }, [tokensParsed]);

  // return {
  //   /** The (raw) tokens: ID token, Access token and Refresh Token */
  //   tokens,
  //   /** The JSON parsed ID and Access token */
  //   tokensParsed,
  //   /**
  //    * The overall auth status, e.g. is the user signed in or not?
  //    * Use this field to show the relevant UI, e.g. render a sign-in page,
  //    * if the status equals "NOT_SIGNED_IN"
  //    */
  //   signInStatus,
  //   /** Sign Out */
  //   signOut: () => {
  //     // setLastError(undefined);
  //     setTokens(undefined);
  //     setTokensParsed(undefined);
  //   },
  //   /** Sign In */
  //   signIn: ({ first_name, last_name }: { first_name: string; last_name: string }) => {
  //     setTokens(JSON.parse(JSON.stringify({ stuff: "things" })));
  //     setTokensParsed({
  //       idToken: JSON.parse(
  //         JSON.stringify({
  //           given_name: first_name,
  //           family_name: last_name,
  //         })
  //       ),
  //     });
  //   },
  // };
}

export type IntervalType = "Minutes" | "Hours" | "Days" | "Weeks";
