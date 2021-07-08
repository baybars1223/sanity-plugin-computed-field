const getAncestor = (props, depth) => {
  console.groupCollapsed('getAncestor')
  let wasSet = false
  let ancestor
  try {
    const { ancestors, final } = getAncestors(props)
    const ancestorIndex = ancestors.length - 1 + depth
    if(ancestorIndex < 0 || ancestorIndex > ancestors.length - 1) {
      throw new Error(`${ancestorIndex} is not a valid index for retrieved ancestors. Based on current node, index must be between 0 and ${ancestors.length - 1}`)
    }
    ancestor = ancestors[ancestorIndex]
    wasSet = true
  } catch (e) {
    console.error(e)
  } finally {
    const output = validateAncestor(wasSet, ancestor)
    output.ancestor = ancestor
    console.log(`Output: ${JSON.stringify(output)}`)
    console.groupEnd('getAncestor')
    return output
  }
}

const getAncestors = (props) => {
  console.groupCollapsed('DEBUG')
  console.log(`props.filterField ${JSON.stringify(props.filterField)}`)
  console.log(props.filterField)
  console.log(`props.onBlur ${JSON.stringify(props.onBlur)}`)
  console.log(props.onBlur)
  console.log(`props.onChange ${JSON.stringify(props.onChange)}`)
  console.log(props.onChange)
  console.log(`props.onFocus ${JSON.stringify(props.onFocus)}`)
  console.log(props.onFocus)
  console.log(`props.ref ${JSON.stringify(props.ref)}`)
  console.log(props.ref)
  console.groupEnd('DEBUG')

  console.groupCollapsed('getAncenstors')
  console.log(`props:`)
  console.log(props)
  let { document } = props
  let pathParts = props.getValuePath()

  let current = document
  let ancestors = []
  console.groupCollapsed('Document Traversal')
  for(let i = 0; i < pathParts.length; i += 1) {
    let part = pathParts[i]
    try {
      ancestors.push(current)
      // console.log(`tree length: ${ancestors.length}\ntree:`)
      // console.log(ancestors)
      if(typeof(part) == 'string') {
        current = current[part]
        continue
      }

      if (typeof(part) == 'object') {
        if(part._key && Array.isArray(current)) {
          let found = current.find((e) => e._key == part._key)
          if (found === undefined) {
            console.log(`Failed to find part._key '${part._key}' in ${JSON.stringify(current)}`)
            break
          }
          current = found
          continue
        }
        if(part._id && Array.isArray(current)) {
          let found = current.find((e) => e._id == part._id)
          if (found === undefined) {
            console.log(`Failed to find part._id '${part._id}' in ${JSON.stringify(current)}`)
            break
          }
          current = found
          continue
        }
      }

      console.log(`Failed to process path part.\nPart Type: ${typeof(part)}\nPart Value: ${JSON.stringify(part)}`)
      break
    } catch (e) {
      console.group()
      console.error(e)
      console.error(`Encountered error while traversing field's ancestors`)
      console.log(`Field Value (props.value):`)
      console.log(props.value)
      console.log(`Field Compare Value (props.compareValue):`)
      console.log(props.compareValue)
      console.log(`Field Type (props.type):`)
      console.log(props.type)
      console.log(`Base Document (props.document):`)
      console.log(props.document)
      console.groupEnd()
      break
    }
  }
  console.groupEnd('Document Traversal')

  console.groupCollapsed('Output')
  console.log('Ancestors:')
  console.log(ancestors)

  console.log('Final Value:')
  console.log(current)

  if(current !== props.value) {
    console.error(`Warning: Final Value of ${JSON.stringify(current)} !== props.value of ${JSON.stringify(props.value)}`)
    if(current !== props.compareValue) {
      console.error(`Warning: Final Value of ${JSON.stringify(current)} !== props.compareValue of ${JSON.stringify(props.compareValue)}`)
    }
  }
  console.groupEnd('Output')

  console.log('Finished.')
  console.groupEnd('getAncenstors')
  return { ancestors, final: current }
}

function validateAncestor( wasSet, ancestor ) {
  if(wasSet) {
    if(ancestor === undefined || ancestor === null || ancestor === '') {
      return { error: true, errorMsg: 'ancestor returned empty' }
    }
    if(typeof(ancestor) == 'object') {
      if (ancestor instanceof Error || ancestor instanceof Function) {
        return { error: true, errorMsg: `ancestor has type 'Error' or 'Function'`}
      }
      return { error: false}
    }
    if(ancestor || ancestor === false || ancestor === 0) {
      return { error: true, errorMsg: 'ancestor not object' }
    }
    return { error: true, errorMsg: 'unhandled falsy case' }
  }
  return { error: true, errorMsg: 'ancestor was never set' }
}

export default {
  getAncestors,
  getAncestor
}