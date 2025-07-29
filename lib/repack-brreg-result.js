const HTTPError = require('./http-error')

const repackAddress = (addressList) => {
  return addressList.filter(address => address).join(', ')
}

const repackBrreg = (enterprise) => {
  if (enterprise.respons_klasse === 'SlettetEnhet') {
    throw new HTTPError(400, `Enterprise with orgnr ${enterprise.organisasjonsnummer} is deleted in Brreg`, {
      respons_klasse: enterprise.respons_klasse,
      orgnr: enterprise.organisasjonsnummer,
      slettedato: enterprise.slettedato
    })
  }

  const address = enterprise.forretningsadresse || enterprise.beliggenhetsadresse || enterprise.postadresse
  if (!address) {
    throw new HTTPError(400, `Enterprise with orgnr ${enterprise.organisasjonsnummer} has no registered address`, {
      respons_klasse: enterprise.respons_klasse,
      orgnr: enterprise.organisasjonsnummer,
      forretningsadresse: enterprise.forretningsadresse,
      beliggenhetsadresse: enterprise.beliggenhetsadresse,
      postadresse: enterprise.postadresse
    })
  }

  if (!enterprise.postadresse) {
    enterprise.postadresse = address
  }

  return {
    Name: enterprise.navn,
    EnterpriseNumber: enterprise.organisasjonsnummer,
    PostAddress: {
      StreetAddress: repackAddress(enterprise.postadresse.adresse),
      ZipCode: enterprise.postadresse.postnummer,
      ZipPlace: enterprise.postadresse.poststed,
      Country: enterprise.postadresse.land,
      County: enterprise.postadresse.kommune
    },
    OfficeAddress: {
      StreetAddress: repackAddress(address.adresse),
      ZipCode: address.postnummer,
      ZipPlace: address.poststed,
      Country: address.land,
      County: address.kommune
    },
    DataSource: 'Brreg - SyncEnterprise'
  }
}

module.exports = { repackAddress, repackBrreg }
