type FintAdresse = {
  adresselinje: string | null;
  postnummer: string | null;
  poststed: string | null;
};

export type FintArbeidsforhold = {
  aktiv: boolean;
  systemId: string;
  gyldighetsperiode: FintPeriode;
  arbeidsforholdsperiode: FintPeriode;
  hovedstilling: boolean;
  ansettelsesprosent: number;
  lonnsprosent: number;
  stillingsnummer: string;
  stillingstittel: string | null;
  stillingskode: FintKodeRelasjon | null;
  arbeidsforholdstype: FintKodeRelasjon | null;
  ansvar: FintKodeRelasjon | null;
  funksjon: FintKodeRelasjon | null;
  narmesteLeder: FintLeder | null;
  arbeidssted: FintStrukturLinje;
  strukturlinje: FintStrukturLinje[];
};

type FintKodeRelasjon = {
  kode: string;
  navn: string;
};

type FintLeder = {
  ansattnummer: string | null;
  navn: string | null;
  fornavn?: string;
  etternavn?: string;
  kontaktEpostadresse: string | null;
};

type FintPeriode = {
  beskrivelse: string | null;
  start: string | null;
  slutt: string | null;
  fintStart: string | null;
  fintSlutt: string | null;
  aktiv: boolean;
};

export type FintStrukturLinje = {
  kortnavn: string | null;
  navn: string | null;
  organisasjonsId: string;
  organisasjonsKode: string;
  leder: FintLeder;
};

export type FintEmployee = {
  ansattnummer: string;
  upn: string;
  aktiv: boolean;
  navn: string | null;
  fornavn: string | null;
  etternavn: string | null;
  fodselsnummer: string;
  fodselsdato: string;
  alder: number | null;
  kjonn: string | null;
  privatEpostadresse: string;
  privatMobiltelefonnummer: string;
  brukernavn: string;
  kontaktEpostadresse: string;
  kontaktMobiltelefonnummer: string;
  bostedsadresse: FintAdresse | null | undefined;
  entraIdOfficeLocation: string;
  ansiennitet: Date | null;
  ansettelsesperiode: FintPeriode;
  personalressurskategori: FintKodeRelasjon;
  arbeidsforhold: FintArbeidsforhold[];
  fullmakter: unknown[];
};
