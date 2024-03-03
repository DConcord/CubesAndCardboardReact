import React from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

interface Props {
  children: React.ReactNode;
  given_name?: string[];
  group?: string[];
}
export default function Authenticated({ children, given_name, group }: Props) {
  const { signInStatus, tokensParsed } = usePasswordless();
  if (!(signInStatus === "SIGNED_IN" && tokensParsed)) return <></>;

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
  // console.log(
  //   group,
  //   given_name_auth,
  //   group_auth,
  //   tokensParsed.idToken["cognito:groups"],
  //   intersect({ a: tokensParsed.idToken["cognito:groups"]!, b: group! })
  // );
  // console.log();
  // console.log(group);
  // console.log(intersect({ a: tokensParsed.idToken["cognito:groups"], b: group }));
  if (signInStatus === "SIGNED_IN" && tokensParsed && given_name_auth && group_auth) {
    return <>{children}</>;
  }
  return <></>;
}

// intersect of two Arrays or Sets
function intersect({ a, b }: { a: string[]; b: string[] }) {
  var setA = new Set(a);
  var setB = new Set(b);
  var intersection = new Set([...setA].filter((x) => setB.has(x)));
  return Array.from(intersection);
}
