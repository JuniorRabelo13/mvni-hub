export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.***.***-${clean.slice(9)}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) *****-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ****-${clean.slice(6)}`;
  }
  return phone;
}

export function maskSensitiveInfo(text: string): string {
  if (!text) return text;
  
  // Mask CPF in text (000.000.000-00 or 00000000000)
  let masked = text.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})|(\d{3})\d{6}(\d{2})/g, (match, p1, p2, p3, p4) => {
    const first = p1 || p3;
    const last = p2 || p4;
    return `${first}.***.***-${last}`;
  });

  // Mask Phone in text ( (00) 00000-0000 or (00) 0000-0000 or 00000000000 )
  // This is trickier because phones vary. Let's do a basic one for common formats.
  masked = masked.replace(/(\(\d{2}\)\s)\d{4,5}-\(\d{4}\)/g, "$1****-$2");
  
  return masked;
}
