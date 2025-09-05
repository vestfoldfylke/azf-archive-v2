const hasSifError = response => {
  if (Object.prototype.hasOwnProperty.call(response, 'Successful') && !response.Successful) return true
  if (Object.prototype.hasOwnProperty.call(response, 'ErrorMessage') && typeof response.ErrorMessage === 'string' && response.ErrorMessage.trim().length > 0 && response.ErrorMessage !== '\n') return true
  return false
}
const repackUglySifError = response => {
  response.ErrorMessage = (response.ErrorMessage && typeof response.ErrorMessage === 'string' && response.ErrorMessage.includes('Exception:')) ? response.ErrorMessage.split('Exception:')[1].split('<operation>')[0] : response.ErrorMessage
  response.ErrorMessage = response.ErrorMessage.replace(/\\"/g, '').replace(/'/g, '').replace(/"/g, '').replace(/"/g, '`').trim()
  return response
}

const repackSifResult = (sifResult) => {
  const excludeProperties = [
    'ErrorDetails',
    'ErrorMessage',
    'Successful',
    'TotalCount',
    'TotalPageCount',
    'NextDeltaLastDate'
  ]
  const keysToInclude = Object.keys(sifResult).filter(key => !excludeProperties.includes(key))
  if (keysToInclude.length === 0) return null // No data
  if (keysToInclude.length > 1) return sifResult // More than one property - return all data WHY did i do this... oh well
  return sifResult[keysToInclude[0]]
}

module.exports = { hasSifError, repackUglySifError, repackSifResult }
