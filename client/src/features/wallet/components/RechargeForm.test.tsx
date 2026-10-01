import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SnailPayResponse } from "../snailpaySchemas";
import { useWallet } from "../useWallet";
import type { RechargeResult } from "../walletService";
import { RechargeForm } from "./RechargeForm";

vi.mock("../useWallet");
const mockedUseWallet = vi.mocked(useWallet);
const rechargeMock = vi.fn();

const response: SnailPayResponse = {
  id: "snp_1",
  status: "approved",
  status_detail: "accredited",
  transaction_amount: 250,
  date_created: "2026-09-30T18:00:00.000Z",
  authorization_code: "123456",
  reference: "SP-ABCDEF1234",
  payer_id: "user-1",
  payer_email: "ana@example.com",
  card_number: "1234123412341234",
  cvv: "543",
};

const wallet = { balanceCents: 25_000, card: null, transactions: [] };

beforeEach(() => {
  rechargeMock.mockReset();
  mockedUseWallet.mockReturnValue({ wallet, recharge: rechargeMock });
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre en la tarjeta"), "Ana Pérez");
  await user.type(screen.getByLabelText("Número de tarjeta"), "1234123412341234");
  await user.type(screen.getByLabelText("Vencimiento (MM/AA)"), "12/26");
  await user.type(screen.getByLabelText("CVV"), "543");
  await user.type(screen.getByLabelText("Monto a recargar"), "250");
}

describe("RechargeForm", () => {
  it("muestra errores de validación y no llama a SnailPay", async () => {
    const user = userEvent.setup();
    render(<RechargeForm onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Recargar" }));

    expect(await screen.findByText("Escribe el nombre que aparece en la tarjeta")).toBeInTheDocument();
    expect(screen.getByText("El número de tarjeta debe tener 16 dígitos")).toBeInTheDocument();
    expect(rechargeMock).not.toHaveBeenCalled();
  });

  it("muestra el panel de operación aprobada con la referencia", async () => {
    const approved: RechargeResult = { outcome: { kind: "approved", response }, wallet };
    rechargeMock.mockResolvedValue(approved);
    const user = userEvent.setup();
    render(<RechargeForm onClose={vi.fn()} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Recargar" }));

    expect(await screen.findByText("Operación aprobada")).toBeInTheDocument();
    expect(screen.getByText("SP-ABCDEF1234")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(rechargeMock).toHaveBeenCalledWith(
      expect.objectContaining({ cardNumber: "1234123412341234", amount: 250 }),
      { simulateOutage: false },
    );
  });

  it("muestra el mensaje de un rechazo y nunca el panel de aprobado", async () => {
    rechargeMock.mockResolvedValue({
      outcome: { kind: "rejected", response, message: "El CVV no coincide con la tarjeta." },
      wallet,
    });
    const user = userEvent.setup();
    render(<RechargeForm onClose={vi.fn()} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Recargar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El CVV no coincide con la tarjeta.");
    expect(screen.queryByText("Operación aprobada")).not.toBeInTheDocument();
  });

  it("muestra un mensaje propio cuando SnailPay no responde a tiempo", async () => {
    rechargeMock.mockResolvedValue({
      outcome: { kind: "timeout", message: "SnailPay tardó demasiado en responder." },
      wallet,
    });
    const user = userEvent.setup();
    render(<RechargeForm onClose={vi.fn()} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Recargar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos confirmar la operación");
    expect(alert).toHaveTextContent("SnailPay tardó demasiado en responder.");
  });

  it("pide simular la caída cuando se marca la casilla de demostración", async () => {
    rechargeMock.mockResolvedValue({
      outcome: { kind: "unavailable", message: "SnailPay no está disponible por el momento." },
      wallet,
    });
    const user = userEvent.setup();
    render(<RechargeForm onClose={vi.fn()} />);

    await fillForm(user);
    await user.click(screen.getByLabelText("Simular caída de SnailPay (solo demostración)"));
    await user.click(screen.getByRole("button", { name: "Recargar" }));

    await screen.findByRole("alert");
    expect(rechargeMock).toHaveBeenCalledWith(expect.anything(), { simulateOutage: true });
  });
});