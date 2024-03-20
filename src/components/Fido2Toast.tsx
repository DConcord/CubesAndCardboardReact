/**
 * Copyright Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You
 * may not use this file except in compliance with the License. A copy of
 * the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */

import { useState, useEffect } from "react";
import { usePasswordless, useAwaitableState, useLocalUserCache } from "amazon-cognito-passwordless-auth/react";
import { timeAgo } from "amazon-cognito-passwordless-auth/util";

function Fido2Recommendation() {
  const { fido2CreateCredential, showAuthenticatorManager, signInStatus } = usePasswordless();
  const { currentUser, updateFidoPreference } = useLocalUserCache();
  const [error, setError] = useState<Error>();
  const [status, setStatus] = useState<"IDLE" | "STARTING" | "INPUT_NAME" | "COMPLETING" | "COMPLETED">("IDLE");
  useEffect(() => {
    if (status !== "COMPLETED") return;
    const i = setTimeout(reset, 10000);
    return () => clearTimeout(i);
  }, [status]);
  const [friendlyName, setFriendlyName] = useState("");
  const { awaitable: awaitableFriendlyName, resolve: resolveFriendlyName } = useAwaitableState(friendlyName);
  const mobileDeviceName = determineMobileDeviceName();
  function reset() {
    setError(undefined);
    setStatus("IDLE");
    setFriendlyName("");
  }
  useEffect(() => {
    if (showAuthenticatorManager) {
      reset();
    }
  }, [showAuthenticatorManager]);
  if (showAuthenticatorManager) return null;
  const show = signInStatus === "SIGNED_IN" && currentUser && (currentUser.useFido === "ASK" || status === "COMPLETED");
  if (!show) return null;
  return (
    <div>
      <div className="passwordless-fido-recommendation">
        {(status === "IDLE" || status === "STARTING") && (
          <>
            <div className="passwordless-fido-recommendation-text">
              We recommend increasing the security of your account by adding face or touch unlock for this website.
            </div>
            <button
              className="passwordless-button passwordless-button-add-face-touch-unlock"
              disabled={status === "STARTING"}
              onClick={() => {
                setStatus("STARTING");
                fido2CreateCredential({
                  friendlyName: () => {
                    if (mobileDeviceName) return mobileDeviceName;
                    setStatus("INPUT_NAME");
                    return awaitableFriendlyName();
                  },
                })
                  .then(() => {
                    updateFidoPreference({ useFido: "YES" });
                  })
                  .catch(setError)
                  .finally(() => setStatus("COMPLETED"));
              }}
            >
              Add face or touch unlock
            </button>
            <div
              onClick={() => {
                updateFidoPreference({ useFido: "NO" });
                reset();
              }}
              className="passwordless-link"
            >
              close
            </div>
          </>
        )}
        {(status === "INPUT_NAME" || status === "COMPLETING") && (
          <form
            className="passwordless-flex"
            onSubmit={(e) => {
              e.preventDefault();
              resolveFriendlyName();
              setStatus("COMPLETING");
              return false;
            }}
          >
            <div className="passwordless-fido-recommendation-text">
              Provide a name for this authenticator, so you can recognize it easily later
            </div>
            <input
              className="passwordless-friendly-name-input"
              autoFocus
              placeholder="authenticator name"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />
            <button
              className="passwordless-button passwordless-button-finish"
              type="submit"
              disabled={!friendlyName || status === "COMPLETING"}
            >
              Finish
            </button>
            <div
              className="passwordless-link"
              onClick={() => {
                updateFidoPreference({ useFido: "NO" });
                reset();
              }}
            >
              cancel
            </div>
          </form>
        )}
        {status === "COMPLETED" && (
          <>
            {" "}
            <div className="passwordless-fido-recommendation-text">
              {error
                ? `Failed to activate face or touch unlock: ${error.message}`
                : "Face or touch unlock activated successfully"}
            </div>
            <div onClick={reset} className="passwordless-link">
              close
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AuthenticatorsManager() {
  const {
    fido2CreateCredential,
    fido2Credentials,
    showAuthenticatorManager,
    toggleShowAuthenticatorManager,
    signInStatus,
  } = usePasswordless();
  const { updateFidoPreference } = useLocalUserCache();
  const [error, setError] = useState<Error>();
  const [addingAuthenticatorStatus, setAddingAuthenticatorStatus] = useState<
    "IDLE" | "STARTING" | "INPUT_NAME" | "COMPLETING"
  >("IDLE");
  const [confirmDeleteRowIndex, setConfirmDeleteRowIndex] = useState<number>(-1);
  const [friendlyName, setFriendlyName] = useState("");
  const [editFriendlyNameRowIndex, setEditFriendlyNameRowIndex] = useState<number>(-1);
  const [editedFriendlyName, setEditedFriendlyName] = useState("");
  const { awaitable: awaitableFriendlyName, resolve: resolveFriendlyName } = useAwaitableState(friendlyName);
  const mobileDeviceName = determineMobileDeviceName();
  const [time, setTime] = useState(new Date());
  function reset() {
    setError(undefined);
    setConfirmDeleteRowIndex(-1);
    setEditFriendlyNameRowIndex(-1);
    setAddingAuthenticatorStatus("IDLE");
    setFriendlyName("");
    setEditedFriendlyName("");
  }
  useEffect(() => {
    if (showAuthenticatorManager) {
      reset();
    }
  }, [showAuthenticatorManager]);
  useEffect(() => {
    if (showAuthenticatorManager && signInStatus === "NOT_SIGNED_IN") {
      toggleShowAuthenticatorManager();
    }
  }, [signInStatus, showAuthenticatorManager, toggleShowAuthenticatorManager]);
  useEffect(() => {
    const intervalId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);
  if (!showAuthenticatorManager) return null;
  const status = {
    isAddingAuthenticator: addingAuthenticatorStatus !== "IDLE",
    isDeletingAuthenticator: confirmDeleteRowIndex !== -1,
    isEditingAuthenticator: editFriendlyNameRowIndex !== -1,
  };
  return (
    <div className="passwordless-table">
      {(addingAuthenticatorStatus === "IDLE" || addingAuthenticatorStatus === "STARTING") && (
        <>
          {fido2Credentials?.length === 0 && (
            <div className="passwordless-no-devices-yet">
              <span>You don&apos;t have any authenticators yet.</span>
              <span>
                Press the button <strong>&quot;Register new authenticator&quot;</strong> to get started.
              </span>
            </div>
          )}
          {!!fido2Credentials?.length && (
            <table>
              <thead>
                <tr
                  className={
                    editFriendlyNameRowIndex !== -1 || confirmDeleteRowIndex !== -1
                      ? "passwordless-table-hide-headers"
                      : ""
                  }
                >
                  <th></th>
                  <th className="passwordless-table-col-last-sign-in">Last sign-in</th>
                  <th className="passwordless-table-col-created-at">Created at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fido2Credentials.map((credential, index) =>
                  editFriendlyNameRowIndex === index ? (
                    <tr key={credential.credentialId}>
                      <td colSpan={4}>
                        <form
                          className="passwordless-edit-friendly-name"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setError(undefined);
                            credential
                              .update({
                                friendlyName: editedFriendlyName,
                              })
                              .then(reset)
                              .catch(setError);
                            return false;
                          }}
                        >
                          <input
                            className="passwordless-friendly-name-input"
                            autoFocus
                            value={editedFriendlyName}
                            onChange={(e) => setEditedFriendlyName(e.currentTarget.value)}
                          />
                          <button
                            className="passwordless-button passwordless-button-save"
                            type="submit"
                            disabled={
                              credential.busy || !editedFriendlyName || editedFriendlyName === credential.friendlyName
                            }
                          >
                            Save
                          </button>
                          <button
                            className="passwordless-button passwordless-button-cancel"
                            onClick={() => setEditFriendlyNameRowIndex(-1)}
                            disabled={credential.busy}
                          >
                            Cancel
                          </button>
                        </form>
                      </td>
                    </tr>
                  ) : confirmDeleteRowIndex === index ? (
                    <tr key={credential.credentialId}>
                      <td colSpan={4}>
                        <div className="passwordless-confirm-delete-device">
                          <span>
                            {" "}
                            Are you sure you want to delete your device named{" "}
                            <strong>&quot;{credential.friendlyName}&quot;</strong>?{" "}
                          </span>
                          <div>
                            <button
                              className="passwordless-button passwordless-button-save"
                              onClick={() => {
                                setError(undefined);
                                credential.delete().then(reset).catch(setError);
                              }}
                              disabled={credential.busy}
                            >
                              Yes
                            </button>
                            <button
                              className="passwordless-button passwordless-button-cancel"
                              onClick={() => {
                                setError(undefined);
                                setConfirmDeleteRowIndex(-1);
                              }}
                              disabled={credential.busy}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={credential.credentialId}>
                      <td className="passwordless-table-col-friendly-name passwordless-table-cell-ellipsis">
                        <span>
                          <button
                            className="passwordless-friendly-name"
                            onClick={() => {
                              setEditFriendlyNameRowIndex(index);
                              setEditedFriendlyName(credential.friendlyName);
                            }}
                            disabled={
                              credential.busy ||
                              status.isAddingAuthenticator ||
                              status.isEditingAuthenticator ||
                              status.isDeletingAuthenticator
                            }
                          >
                            <svg
                              className="passwordless-edit-icon"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                            {credential.friendlyName}
                          </button>
                        </span>
                      </td>
                      <td className="passwordless-table-col-last-sign-in">
                        {timeAgo(time, credential.lastSignIn) || "Never"}
                      </td>
                      <td className="passwordless-table-col-created-at">
                        {timeAgo(time, credential.createdAt) || "Unknown"}
                      </td>
                      <td className="passwordless-table-col-delete">
                        <button
                          className="passwordless-button passwordless-button-outlined passwordless-button-delete"
                          onClick={() => {
                            setError(undefined);
                            setConfirmDeleteRowIndex(index);
                          }}
                          disabled={
                            credential.busy ||
                            status.isAddingAuthenticator ||
                            status.isEditingAuthenticator ||
                            status.isDeletingAuthenticator
                          }
                        >
                          <svg
                            className="passwordless-delete-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </>
      )}
      <div className="passwordless-authenticators-action-row">
        {(addingAuthenticatorStatus === "IDLE" || addingAuthenticatorStatus === "STARTING") && (
          <button
            className="passwordless-button passwordless-button-add-authenticator"
            onClick={() => {
              setAddingAuthenticatorStatus("STARTING");
              setError(undefined);
              fido2CreateCredential({
                friendlyName: () => {
                  if (mobileDeviceName) return mobileDeviceName;
                  setAddingAuthenticatorStatus("INPUT_NAME");
                  return awaitableFriendlyName();
                },
              })
                .then(() => {
                  updateFidoPreference({ useFido: "YES" });
                  reset();
                })
                .catch(setError)
                .finally(() => setAddingAuthenticatorStatus("IDLE"));
            }}
            disabled={
              addingAuthenticatorStatus === "STARTING" ||
              status.isEditingAuthenticator ||
              status.isDeletingAuthenticator
            }
          >
            Register new authenticator
          </button>
        )}
        {(addingAuthenticatorStatus === "INPUT_NAME" || addingAuthenticatorStatus === "COMPLETING") && (
          <form
            className="passwordless-flex"
            onSubmit={(e) => {
              e.preventDefault();
              resolveFriendlyName();
              setAddingAuthenticatorStatus("COMPLETING");
              return false;
            }}
          >
            <div className="passwordless-fido-recommendation-text">
              Provide a name for this authenticator, so you can recognize it easily later
            </div>
            <input
              className="passwordless-friendly-name-input"
              autoFocus
              placeholder="authenticator name"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />
            <button
              className="passwordless-button passwordless-button-finish"
              type="submit"
              disabled={!friendlyName || addingAuthenticatorStatus === "COMPLETING"}
            >
              Finish
            </button>
          </form>
        )}
        <div onClick={() => toggleShowAuthenticatorManager()} className="passwordless-link">
          close
        </div>
      </div>
      {error && <div className="passwordless-authenticator-error">{error.message}</div>}
    </div>
  );
}

export default function Fido2Toast() {
  return (
    <>
      <Fido2Recommendation />
      <AuthenticatorsManager />
    </>
  );
}

function determineMobileDeviceName() {
  const mobileDevices = ["Android", "webOS", "iPhone", "iPad", "iPod", "BlackBerry", "Windows Phone"] as const;
  return mobileDevices.find((dev) =>
    // eslint-disable-next-line security/detect-non-literal-regexp
    navigator.userAgent.match(new RegExp(dev, "i"))
  );
}
