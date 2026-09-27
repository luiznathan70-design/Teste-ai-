/**
 * Geração do "Pix Copia e Cola" (BR Code / EMV QRCPS-MPM) estático com valor.
 * Referência: Manual de Padrões para Iniciação do Pix — Banco Central do Brasil.
 */

function field(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) */
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do padrão EMV */
function sanitize(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

export function buildPixPayload(opts: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  txid?: string;
  description?: string;
}) {
  const gui = field("00", "br.gov.bcb.pix");
  const key = field("01", opts.key.trim());
  const desc = opts.description ? field("02", sanitize(opts.description, 40)) : "";
  const merchantAccount = field("26", gui + key + desc);

  const txid = sanitize(opts.txid ?? "***", 25).replace(/[^A-Z0-9]/g, "") || "***";

  let payload =
    field("00", "01") +
    merchantAccount +
    field("52", "0000") +
    field("53", "986") +
    (opts.amountCents ? field("54", (opts.amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", sanitize(opts.merchantName, 25) || "RECEBEDOR") +
    field("60", sanitize(opts.merchantCity, 15) || "BRASIL") +
    field("62", field("05", txid));

  payload += "6304";
  return payload + crc16(payload);
}
