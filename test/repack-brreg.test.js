const { repackBrreg } = require('../lib/repack-brreg-result')
const data = require('./data/brreg-data.json')

const addressFields = {
  land: 'Norge',
  landkode: 'NO',
  postnummer: '6969',
  poststed: 'Prolapsbyen',
  adresse: [
    'Prolapsgata 4'
  ],
  kommune: 'Prolaps',
  kommunenummer: '1234'
}

describe('repackBrreg returns as expected when', () => {
  test('enterprise is active and has an forretningsadresse', () => {
    const enterprise = {
      ...data,
      forretningsadresse: addressFields
    }
    const repackedEnterprise = repackBrreg(enterprise)
    expect(repackedEnterprise.Name).toBe(data.navn)
    expect(repackedEnterprise.EnterpriseNumber).toBe(data.organisasjonsnummer)
    expect(repackedEnterprise.PostAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.PostAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.PostAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.PostAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.PostAddress.County).toBe(addressFields.kommune)
    expect(repackedEnterprise.OfficeAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.OfficeAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.OfficeAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.OfficeAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.OfficeAddress.County).toBe(addressFields.kommune)
  })

  test('enterprise is active and has an beliggenhetsadresse', () => {
    const enterprise = {
      ...data,
      beliggenhetsadresse: addressFields
    }
    const repackedEnterprise = repackBrreg(enterprise)
    expect(repackedEnterprise.Name).toBe(data.navn)
    expect(repackedEnterprise.EnterpriseNumber).toBe(data.organisasjonsnummer)
    expect(repackedEnterprise.PostAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.PostAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.PostAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.PostAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.PostAddress.County).toBe(addressFields.kommune)
    expect(repackedEnterprise.OfficeAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.OfficeAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.OfficeAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.OfficeAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.OfficeAddress.County).toBe(addressFields.kommune)
  })

  test('enterprise is active and has an postadresse', () => {
    const enterprise = {
      ...data,
      postadresse: addressFields
    }
    const repackedEnterprise = repackBrreg(enterprise)
    expect(repackedEnterprise.Name).toBe(data.navn)
    expect(repackedEnterprise.EnterpriseNumber).toBe(data.organisasjonsnummer)
    expect(repackedEnterprise.PostAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.PostAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.PostAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.PostAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.PostAddress.County).toBe(addressFields.kommune)
    expect(repackedEnterprise.OfficeAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.OfficeAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.OfficeAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.OfficeAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.OfficeAddress.County).toBe(addressFields.kommune)
  })

  test('enterprise is active and has an forretningsadresse and a separate postadresse', () => {
    const postadresse = {
      land: 'Norge',
      landkode: 'NO',
      postnummer: '5678',
      poststed: 'Postbyen',
      adresse: [
        'Postgata 1'
      ],
      kommune: 'Post',
      kommunenummer: '5678'
    }
    const enterprise = {
      ...data,
      forretningsadresse: addressFields,
      postadresse
    }
    const repackedEnterprise = repackBrreg(enterprise)
    expect(repackedEnterprise.Name).toBe(data.navn)
    expect(repackedEnterprise.EnterpriseNumber).toBe(data.organisasjonsnummer)
    expect(repackedEnterprise.PostAddress.StreetAddress).toBe(postadresse.adresse[0])
    expect(repackedEnterprise.PostAddress.ZipCode).toBe(postadresse.postnummer)
    expect(repackedEnterprise.PostAddress.ZipPlace).toBe(postadresse.poststed)
    expect(repackedEnterprise.PostAddress.Country).toBe(postadresse.land)
    expect(repackedEnterprise.PostAddress.County).toBe(postadresse.kommune)
    expect(repackedEnterprise.OfficeAddress.StreetAddress).toBe(addressFields.adresse[0])
    expect(repackedEnterprise.OfficeAddress.ZipCode).toBe(addressFields.postnummer)
    expect(repackedEnterprise.OfficeAddress.ZipPlace).toBe(addressFields.poststed)
    expect(repackedEnterprise.OfficeAddress.Country).toBe(addressFields.land)
    expect(repackedEnterprise.OfficeAddress.County).toBe(addressFields.kommune)
  })
})

describe('repackBrreg throws an error when', () => {
  test('enterprise respons_klasse is SlettetEnhet', () => {
    const enterprise = {
      ...data,
      respons_klasse: 'SlettetEnhet',
      slettedato: '2023-10-01'
    }
    expect(() => repackBrreg(enterprise)).toThrow(`Enterprise with orgnr ${enterprise.organisasjonsnummer} is deleted in Brreg`)
  })

  test('enterprise is active but has no postadresse, forretningsadresse or beliggenhetsadresse were found', () => {
    const enterprise = {
      ...data,
      postadresse: undefined,
      forretningsadresse: undefined,
      beliggenhetsadresse: undefined
    }
    expect(() => repackBrreg(enterprise)).toThrow(`Enterprise with orgnr ${enterprise.organisasjonsnummer} has no registered address`)
  })
})
