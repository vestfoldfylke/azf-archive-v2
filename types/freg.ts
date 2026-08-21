export type FregAddress = {
  adressegradering: string
  gateadresse: string
  postnummer: string
  poststed: string
  landkode: string
};

export type FregRepackedResponse = {
  address: {
    streetAddress: string;
    zipCode: string;
    zipPlace: string;
  };
  addressProtection: boolean;
};

export type FregResponse = {
  foedselsEllerDNummer: string
  status: string
  kanKontaktes: boolean
  fornavn: string
  etternavn: string
  fulltnavn: string
  foedselsdato: string | undefined
  alder: number | null
  doedsfall: {
    erGjeldende: boolean
  } | null
  adressebeskyttelse: string[]
  bostedsadresse: FregAddress | null
  deltbostedsadresse: FregAddress | null
  oppholdsadresse: FregAddress | null
  postadresse: FregAddress
  postadresseIUtlandet: FregAddress | null
};
