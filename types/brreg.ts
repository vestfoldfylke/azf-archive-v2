export type BrregEnhet = {
  respons_klasse: "Enhet" | "SlettetEnhet" | "Underenhet";
  organisasjonsnummer: string;
  navn: string;
  postadresse?: BrregAdresse;
  forretningsadresse?: BrregAdresse;
  beliggenhetsadresse?: BrregAdresse;
  slettedato?: string;
};

export type BrregEnhetRepacked = {
  Name: string;
  EnterpriseNumber: string;
  PostAddress: {
    StreetAddress: string;
    ZipCode: string;
    ZipPlace: string;
    Country: string;
    County: string;
  };
  OfficeAddress: {
    StreetAddress: string;
    ZipCode: string;
    ZipPlace: string;
    Country: string;
    County: string;
  };
  DataSource: string;
};

export type BrregAdresse = {
  kommune: string;
  landkode: string;
  postnummer: string;
  adresse: string[];
  land: string;
  kommunenummer: string;
  poststed: string;
};
