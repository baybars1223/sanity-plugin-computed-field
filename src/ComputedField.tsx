import * as React from 'react'
import {withValuePath, withDocument} from 'part:@sanity/form-builder'
import {
  TextInput,
  Button,
  Box,
  Flex,
  Stack,
  ThemeProvider,
  studioTheme,
  Switch,
  TextArea,
  Spinner,
} from '@sanity/ui'

import {Marker, Path, isValidationErrorMarker, SanityDocument} from '@sanity/types'
import DefaultFormField from 'part:@sanity/components/formfields/default'
// import styles from './ComputedField.css'
import PatchEvent, {set, unset} from 'part:@sanity/form-builder/patch-event'

//TODO: fix import typing
import recomputeHelpers from './recompute.js'
type SanityType = {
  _type?: string
  title: string
  description?: string
  name: string
  options: {
    buttonText?: string
    editable?: boolean
    ancestorDepth: number
    //TODO: fix type signature
    recomputeHandler: (result: {[s: string]: any}) => number | string | null
    [s: string]: any
  }
}

export type SanityProps = {
  type: SanityType
  document: SanityDocument
  presence?: string
  readOnly?: boolean
  markers: Marker[]
  value?: unknown
  level?: number
  onFocus: (pathOrEvent?: Path | React.FocusEvent<any>) => void
  onChange: (ev: any) => void
}

const validateConfiguration = (options: SanityType['options']) => {
  // const help = 'https://github.com/wildseansy/sanity-plugin-computed-field#readme'
  // TODO: update README
  const help = 'jk, I still need to modify the documentation'
  if (!options) {
    throw new Error(`ComputedField: options required. See '${help}'`)
  } else {
    let missingKeys = []
    if (!options.ancestorDepth && options.ancestorDept !== 0) {
      missingKeys.push('ancestorDepth')
    } else if (options.ancestorDepth > 0) {
      throw new Error(`ComputedField: options invalid. options.ancestorDepth must be <= 0.`)
    }
    if (!options.recomputeHandler) {
      missingKeys.push('recomputeHandler')
    }
    if (missingKeys.length > 0) {
      throw new Error(
        `ComputedField: options incomplete. Please follow ${help}.${missingKeys.reduce(
          (acc, cur) => {
            acc += `\n\toptions.${cur} is required`
            return acc
          },
          ''
        )}`
      )
    }
  }
}

const ComputedField: React.FC<SanityProps> = React.forwardRef(
  (props: SanityProps, forwardedRef: React.ForwardedRef<HTMLInputElement>) => {
    const {type, level, onFocus, value, markers} = props
    const document = props.document
    const errors = React.useMemo(() => markers.filter(isValidationErrorMarker), [markers])
    const [loading, setLoading] = React.useState(false)
    const {_id, _type}: SanityDocument = document
    const options = props.type.options
    validateConfiguration(options)
    const handleRecompute = React.useCallback(
      //TODO: fix type signature
      (result: {[s: string]: unknown}) => options.recomputeHandler(result),
      [options.recomputeHandler]
    )
    const handleChange = React.useCallback(
      (val: any) => {
        let validated = val
        if (type.name === 'number') {
          validated = parseFloat(val)
          if (validated === NaN) {
            validated = undefined
          }
        }
        props.onChange(PatchEvent.from(validated ? set(validated) : unset()))
      },
      [props.onChange, type.name]
    )
    const onChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
      [handleChange]
    )
    const recompute = React.useCallback(
      async (_event, props) => {
        setLoading(true)
        const {ancestor, error, errorMsg} = recomputeHelpers.getAncestor(
          props,
          options.ancestorDepth
        )
        if (error) {
          throw new Error(errorMsg)
        }
        const newValue = handleRecompute(ancestor)
        if (newValue !== value) {
          handleChange(newValue)
        }
        setLoading(false)
      },
      [handleChange, handleRecompute, value, _id, _type]
    )
    let TextComponent = type.name === 'text' ? TextArea : TextInput
    return (
      <ThemeProvider theme={studioTheme}>
        <Stack space={1}>
          <DefaultFormField
            label={type.title || type.name}
            level={level}
            description={type.description}
            presence={props.presence}
            markers={props.markers}
          >
            {type.name === 'boolean' ? (
              <Switch
                checked={value}
                disabled={!options.editable}
                ref={forwardedRef}
                onChange={options.editable ? onChange : null}
              />
            ) : (
              <TextComponent
                disabled={!options.editable}
                type={type.name === 'number' ? 'number' : 'text'}
                customValidity={errors.length > 0 ? errors[0].item.message : ''}
                ref={forwardedRef}
                onChange={options.editable ? onChange : null}
                value={value || ''}
              />
            )}
          </DefaultFormField>
          <Flex align="center">
            <Button
              mode="ghost"
              type="button"
              onClick={(event: any) => recompute(event, props)}
              onFocus={onFocus}
              text={options.buttonText || 'Regenerate'}
            />
            {loading && (
              <Box paddingLeft={2}>
                <Spinner muted />
              </Box>
            )}
          </Flex>
        </Stack>
      </ThemeProvider>
    )
  }
)

export default withValuePath(withDocument(ComputedField))
