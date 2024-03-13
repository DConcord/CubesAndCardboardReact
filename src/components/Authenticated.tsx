import React from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { Navigate } from "react-router-dom";

import { CognitoAccessTokenPayload, CognitoIdTokenPayload } from "amazon-cognito-passwordless-auth/jwt-model";

type TokensParsed = {
  idToken: CognitoIdTokenPayload;
  accessToken: CognitoAccessTokenPayload;
  expireAt: Date;
};

interface AuthenticatedProps {
  children: React.ReactNode;
  given_name?: string[];
  group?: string[];
  unauthPath?: string;
  show?: boolean;
}
export default function Authenticated({ children, given_name, group, unauthPath, show = true }: AuthenticatedProps) {
  const { signInStatus, tokensParsed } = usePasswordless();
  if (!show) return <></>;
  if (["REFRESHING_SIGN_IN", "SIGNING_IN", "CHECKING"].includes(signInStatus)) {
    return <></>;
  }

  if (authenticated({ signInStatus, tokensParsed, given_name: given_name, group: group })) {
    return <>{children}</>;
  } else {
    if (unauthPath != undefined) return <Navigate to={unauthPath} />;
    return <></>;
  }
}

export function authenticated({
  signInStatus,
  tokensParsed,
  given_name,
  group,
}: {
  signInStatus: "SIGNING_OUT" | "SIGNED_IN" | "REFRESHING_SIGN_IN" | "SIGNING_IN" | "CHECKING" | "NOT_SIGNED_IN";
  tokensParsed?: TokensParsed;
  given_name?: string[];
  group?: string[];
}) {
  if (!(signInStatus === "SIGNED_IN" && tokensParsed)) return false;

  let given_name_auth = false;
  if (given_name) {
    given_name_auth = given_name.includes(String(tokensParsed.idToken.given_name));
  } else given_name_auth = true;

  let group_auth = false;
  if (group) {
    if (tokensParsed.idToken["cognito:groups"]) {
      if (intersect({ a: tokensParsed.idToken["cognito:groups"], b: group }).length > 0) group_auth = true;
    }
  } else group_auth = true;

  if (signInStatus === "SIGNED_IN" && tokensParsed && given_name_auth && group_auth) {
    return true;
  }
  return false;
}
// intersect of two Arrays or Sets
function intersect({ a, b }: { a: string[]; b: string[] }) {
  var setA = new Set(a);
  var setB = new Set(b);
  var intersection = new Set([...setA].filter((x) => setB.has(x)));
  return Array.from(intersection);
}
