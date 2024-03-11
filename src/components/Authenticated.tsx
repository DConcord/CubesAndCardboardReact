import React from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

interface AuthenticatedProps {
  children: React.ReactNode;
  given_name?: string[];
  group?: string[];
}
export default function Authenticated({ children, given_name, group }: AuthenticatedProps) {
  if (authenticated({ given_name: given_name, group: group })) {
    return <>{children}</>;
  } else {
    return <></>;
  }
}

export function authenticated({ given_name, group }: { given_name?: string[]; group?: string[] }) {
  const { signInStatus, tokensParsed } = usePasswordless();
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
