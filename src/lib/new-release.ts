export type NewReleaseCard = {
  image: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonLink: string;
};

export function emptyCard(): NewReleaseCard {
  return { image: "", title: "", text: "", buttonLabel: "", buttonLink: "" };
}

/** Safely parse the JSON stored in the `newReleaseCards` setting. */
export function parseNewReleaseCards(json: string | undefined | null): NewReleaseCard[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => ({
        image: String(c?.image ?? ""),
        title: String(c?.title ?? ""),
        text: String(c?.text ?? ""),
        buttonLabel: String(c?.buttonLabel ?? ""),
        buttonLink: String(c?.buttonLink ?? ""),
      }))
      .filter((c) => c.image || c.title || c.text);
  } catch {
    return [];
  }
}
