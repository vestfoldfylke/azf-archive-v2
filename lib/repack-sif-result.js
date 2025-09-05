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

const filterSifResult = (result, options) => {
  if (!options) throw new Error('No options provided to filterSifResult')
  // Only open or exclude expired Cases Option
  if (options?.onlyOpenCases) {
    result = result.filter(({ Status }) => Status === 'Under behandling')
  } else if (options?.excludeExpiredCases) {
    result = result.filter(({ Status }) => Status !== 'Utgår')
  }
  // Limit options
  if (options?.limit === 1) {
    if (result.length > 0) {
      return result[0]
    } else {
      return null // jaja...
    }
  } else if (options?.limit > 1) {
    return result.slice(0, options.limit)
  }
  return result
}

module.exports = { hasSifError, repackUglySifError, repackSifResult, filterSifResult }
