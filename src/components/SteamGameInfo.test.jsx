import { render, screen } from "@testing-library/react";
import SteamGameInfo from "./SteamGameInfo";

const base = { appId: 281990, buildId: "1", lastUpdate: 1700000000000 };

describe("SteamGameInfo — ligne Steam Workshop", () => {
  it.each([
    [true, "oui"],
    [false, "non"],
    [null, "inconnu"],
    [undefined, "inconnu"],
  ])("workshop %p → « %s »", (workshop, libelle) => {
    render(<SteamGameInfo domain="stellaris" steamInfo={{ ...base, workshop }} />);
    expect(screen.getByText("Steam Workshop").nextSibling).toHaveTextContent(libelle);
  });
});
