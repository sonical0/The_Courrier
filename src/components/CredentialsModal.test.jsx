import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CredentialsModal from "./CredentialsModal";

const noop = () => {};

describe("CredentialsModal", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ne rend rien quand show est false", () => {
    const { container } = render(
      <CredentialsModal show={false} onSave={noop} onCancel={noop} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("affiche le formulaire quand show est true", () => {
    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    expect(screen.getByText("Configuration Nexus Mods")).toBeInTheDocument();
    expect(screen.getByTestId("test-connection-btn")).toBeInTheDocument();
  });

  it("desactive le bouton Tester si les champs sont vides", () => {
    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId("test-connection-btn")).toBeDisabled();
  });

  it("desactive le bouton Tester si seul le username est rempli", async () => {
    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    expect(screen.getByTestId("test-connection-btn")).toBeDisabled();
  });

  it("active le bouton Tester quand username et apiKey sont remplis", async () => {
    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "abc123");
    expect(screen.getByTestId("test-connection-btn")).not.toBeDisabled();
  });

  it("affiche un message de succes apres une reponse 200 de l'API", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "TestUser" }),
    });

    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "valid-key");
    fireEvent.click(screen.getByTestId("test-connection-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("test-result-message")).toHaveTextContent("Connexion reussie");
    });
    // L'etat est lu sur un attribut plutot que sur une classe de couleur :
    // l'assertion portait sur `text-green-700`, donc sur la feuille de style,
    // et cassait a chaque changement d'apparence sans rien dire du comportement.
    expect(screen.getByTestId("test-result-message")).toHaveAttribute("data-etat", "succes");
  });

  it("affiche un message d'erreur apres une reponse non-200 de l'API", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "bad-key");
    fireEvent.click(screen.getByTestId("test-connection-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("test-result-message")).toHaveTextContent("invalide");
    });
    expect(screen.getByTestId("test-result-message")).toHaveAttribute("data-etat", "erreur");
  });

  it("affiche un message d'erreur si fetch echoue (reseau)", async () => {
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "any-key");
    fireEvent.click(screen.getByTestId("test-connection-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("test-result-message")).toHaveTextContent("Impossible de contacter");
    });
  });

  it("reinitialise le resultat du test quand username change", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "TestUser" }),
    });

    render(<CredentialsModal show={true} onSave={noop} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "testuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "valid-key");
    fireEvent.click(screen.getByTestId("test-connection-btn"));
    await waitFor(() => screen.getByTestId("test-result-message"));

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "x");
    expect(screen.queryByTestId("test-result-message")).toBeNull();
  });

  it("appelle onSave avec les valeurs correctes a la soumission", async () => {
    const onSave = jest.fn();
    render(<CredentialsModal show={true} onSave={onSave} onCancel={noop} />);
    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), "monuser");
    await userEvent.type(screen.getByLabelText(/Cl[eé] API/i), "maclef");
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    expect(onSave).toHaveBeenCalledWith("monuser", "maclef");
  });
});
