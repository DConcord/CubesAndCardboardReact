import { useState, createContext, useContext, useMemo } from "react";

const PasswordlessContext = createContext<UsePasswordless | undefined>(
  undefined
);
type UsePasswordless = ReturnType<typeof _usePasswordless>;

/** React hook that provides convenient access to the Passwordless lib's features */
export function usePasswordless() {
  const context = useContext(PasswordlessContext);
  if (!context) {
    throw new Error(
      "The DemoPasswordlessContextProvider must be added above this consumer in the React component tree"
    );
  }
  return context;
}

export const PasswordlessContextProvider = (props: {
  children: React.ReactNode;
  enableLocalUserCache?: boolean;
}) => {
  return (
    <PasswordlessContext.Provider value={_usePasswordless()}>
      {props.children}
    </PasswordlessContext.Provider>
  );
};

export function Fido2Toast() {
  return <div></div>;
}

function _usePasswordless() {
  const [tokens, setTokens] = useState();
  const [tokensParsed, setTokensParsed] = useState<{
    idToken: {
      given_name: string;
      family_name: string;
    }; //CognitoIdTokenPayload;
    // accessToken: CognitoAccessTokenPayload;
    // expireAt: Date;
  }>();

  // Determine sign-in status
  const signInStatus = useMemo(() => {
    return tokensParsed ? ("SIGNED_IN" as const) : ("NOT_SIGNED_IN" as const);
  }, [tokensParsed]);

  return {
    /** The (raw) tokens: ID token, Access token and Refresh Token */
    tokens,
    /** The JSON parsed ID and Access token */
    tokensParsed,
    /**
     * The overall auth status, e.g. is the user signed in or not?
     * Use this field to show the relevant UI, e.g. render a sign-in page,
     * if the status equals "NOT_SIGNED_IN"
     */
    signInStatus,
    /** Sign Out */
    signOut: () => {
      // setLastError(undefined);
      setTokens(undefined);
      setTokensParsed(undefined);
    },
    /** Sign In */
    signIn: ({
      first_name,
      last_name,
    }: {
      first_name: string;
      last_name: string;
    }) => {
      setTokens(JSON.parse(JSON.stringify({ stuff: "things" })));
      setTokensParsed({
        idToken: JSON.parse(
          JSON.stringify({
            given_name: first_name,
            family_name: last_name,
          })
        ),
      });
    },
  };
}
