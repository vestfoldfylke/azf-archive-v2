export type KRRKontaktinformasjon = {
  epostadresse?: string;
  epostadresse_oppdatert?: string;
  epostadresse_sist_verifisert?: string;
  epostadresse_sist_validert?: string;
  epostadresse_duplisert?: string;
  mobiltelefonnummer?: string;
  mobiltelefonnummer_oppdatert?: string;
  mobiltelefonnummer_sist_verifisert?: string;
  mobiltelefonnummer_sist_validert?: string;
  mobiltelefonnummer_duplisert?: string;
};

export type KRRPerson = {
  personidentifikator: string;
  reservasjon: "JA" | "NEI";
  status: "AKTIV" | "SLETTET" | "IKKE_REGISTRERT";
  varslingsstatus: "KAN_VARSLES" | "KAN_IKKE_VARSLES";
  kontaktinformasjon?: KRRKontaktinformasjon;
  sprak?: string;
  sprak_oppdatert?: string;
  oppdatert?: string;
};

export type KRResponse = {
  personer: KRRPerson[];
};

export type KRResult = {
  email: string | undefined;
  phoneNumber: string | undefined;
};
