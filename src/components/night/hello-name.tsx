"use client";

import { useEffect, useState } from "react";

const KEY = "gg-name";
const clean = (v: string) => v.replace(/[^\p{L}\p{M}' -]/gu, "").trim().split(/\s+/)[0]?.slice(0, 24) ?? "";

/**
 * Hero welcome. Signed-in customers are greeted by their account name; other
 * visitors can tell us what to call them. That name stays on their device
 * (localStorage) and is never sent to the server.
 */
export function HelloName({ accountName, signedIn }: { accountName?: string; signedIn: boolean }) {
  const [name, setName] = useState(accountName ?? "");
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(signedIn);

  useEffect(() => {
    if (signedIn) return;
    let saved = "";
    try {
      saved = localStorage.getItem(KEY) ?? "";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the name saved on this device after hydration
    if (saved) setName(saved);
    setReady(true);
  }, [signedIn]);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = clean(String(new FormData(e.currentTarget).get("name") ?? ""));
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {}
    setName(v);
    setEditing(false);
  }

  return (
    <>
      <h1 key={name} className={name ? "gn-hi" : undefined}>
        {name ? (signedIn ? `Welcome back, ${name}` : `Welcome, ${name}`) : "Welcome to GreenGene"}
      </h1>
      {!signedIn && ready && (
        <div className="gn-name">
          {editing ? (
            <form onSubmit={save}>
              <label className="sr-only" htmlFor="gn-name-input">Your first name</label>
              <input id="gn-name-input" name="name" defaultValue={name} placeholder="Your first name" autoComplete="given-name" maxLength={24} autoFocus />
              <button type="submit">Save</button>
            </form>
          ) : name ? (
            <>Not {name}? <button type="button" className="link" onClick={() => setEditing(true)}>Change name</button></>
          ) : (
            <button type="button" className="link" onClick={() => setEditing(true)}>What should we call you?</button>
          )}
        </div>
      )}
    </>
  );
}
