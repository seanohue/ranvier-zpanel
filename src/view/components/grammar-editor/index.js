import './styles.scss'
import merge from 'mergerino'
const { TagInput, Tag, Icon, Button, Input } = require('construct-ui')

export default class GrammarEditor {
  constructor (vnode) {
    this.isLoading = false
    this.entityGrammarFetched = false
    this.newGrammarName = ''
    this.isShared = (vnode.attrs.type === 'shared')
  }

  oninit () {
    // load shared grammar
    m.request({
      method: 'GET',
      url: '/api/grammar',
    }).then(data => {
      delete data._id
      delete data._rev
      window.$zp.grammar(data)
    })
  }

  onupdate (vnode) {
    // if not a sharred grammar, then once the parent is initialized
    // and the editor stream is populated, fetch the entity's
    // prototype's grammar, if applicable
    if (this.entityGrammarFetched === false &&
        !this.isShared &&
        window.$zp.editor().prototype) {
      m.request({
        method: 'GET',
        url: `/api/${vnode.attrs.type}/${window.$zp.editor().prototype.split(':')[0]}/${window.$zp.editor().prototype.split(':')[1]}`,
      }).then(data => {
        if (data.ok === false || Array.isArray(data)) {
          return
        }
        this.entityGrammarFetched = true
        this.protoGrammarProps = data.metadata.grammar
        this.renderedProtoGrammarTagInputs = this.renderProtoGrammarTagInputs(this.protoGrammarProps)

        if (!window.$zp.editor().metadata) {
          window.$zp.editor(merge(window.$zp.editor(), { metadata: {} }))
        }
        if (!window.$zp.editor().metadata.grammar) {
          window.$zp.editor(merge(window.$zp.editor(), {
            metadata: {
              ...window.$zp.editor().metadata,
              grammar: {}
            }
          }))
        }
      })
    }
  }

  renderProtoGrammarTagInputs (protoGrammarProps) {
    if (!protoGrammarProps) return
    return Object.keys(protoGrammarProps).map((val, i) => {
      return (
        <div class="entity-grammar" key={i} id={`entity-grammar-${val}`}>
          <label>{val}</label>
          <TagInput
            disabled
            tags={protoGrammarProps[val].map((val2, i2) => {
              return ((<Tag key={i2}
                label={val2}
              />))
            })}
          />
          <Icon name="plus" intent="positive" class={`extended-grammar-${window.$zp.editor().metadata.grammar[val] ? true : false}`} onclick={() => {
            window.$zp.editor(merge(window.$zp.editor(), {
              metadata: {
                grammar: merge({
                  ...window.$zp.editor().metadata.grammar,
                  [val]: {
                    '...': true,
                    value: []
                  }
                })
              }
            }))
            this.renderedProtoGrammarTagInputs = this.renderProtoGrammarTagInputs(this.protoGrammarProps)
          }}/>
        </div>
      )
    })
  }

  renderProtoGrammarForProp (prop) {
    if (!window.$zp.editor().metadata.grammar[prop]) {
      return {
        isNested: undefined,
        protoGrammarVals: undefined,
        grammarValues: [],
        grammarProp: []
      }
    }
    let isNested
    if (window.$zp.editor().metadata.grammar[prop].value) {
      isNested = (<label>(extended)</label>)
    }

    let protoGrammarVals = []
    if (this.protoGrammarProps && this.protoGrammarProps[prop]) {
      protoGrammarVals = this.protoGrammarProps[prop]
      // TODO: fetch prototype's prototype, if applicable
    }

    const grammarValues = window.$zp.editor().metadata.grammar[prop].value || window.$zp.editor().metadata.grammar[prop]

    const grammarProp = (window.$zp.editor().metadata.grammar[prop].value || window.$zp.editor().metadata.grammar[prop])

    return { isNested, protoGrammarVals, grammarValues, grammarProp }
  }

  addNewGrammar () {
    if (this.newGrammarName.length > 0) {
      if (!this.isShared) {
        window.$zp.editor(merge(window.$zp.editor(), {
          metadata: {
            grammar: merge({
              ...window.$zp.editor().metadata.grammar,
              [this.newGrammarName]: []
            })
          }
        }))
      } else {
        window.$zp.grammar(merge(window.$zp.grammar(), {
          [this.newGrammarName]: []
        }))
      }
      
      this.newGrammarName = ''
      m.redraw()
    }
  }

  view (vnode) {
    if (vnode.attrs.type === 'shared') {
      // if the shared grammar hasn't been loaded yet, return
      if (!window.$zp.grammar()) return

      return (
        <div class="grammar-editor">
          {Object.keys(window.$zp.grammar()).map((value, index) => {
            if (window.$zp.grammar()[value][0] === '__DELETED') {
              return (<div key={index}></div>)
            }
            return (
              <div class="shared-grammar" key={index}>
                <label>{value}</label>
                <TagInput
                  tags={window.$zp.grammar()[value].map((val, i) => {
                    return (<Tag key={i}
                      label={val}
                      onRemove={() => {
                        window.$zp.grammar(merge(window.$zp.grammar(), {
                          [value]: window.$zp.grammar()[value].filter(x => x !== val)
                        }))
                      }}
                    />)
                  })}
                  onAdd={
                    (e) => {
                      window.$zp.grammar()[value].push(e)
                      window.$zp.grammar(merge(window.$zp.grammar(), {
                        [value]: window.$zp.grammar()[value]
                      }))
                    }
                  }
                />
                <Icon name="x-square" intent="negative" onclick={() => {
                  const old = window.$zp.grammar()
                  old[value] = ['__DELETED']
                  window.$zp.grammar(old)
                }}/>
              </div>
            )
          })}
          <div class="new-grammar-prop">
            <label>Add a new shared grammar property</label>
            <Input placeholder="Shared grammar property name" intent="positive" onchange={(e) => {
              this.newGrammarName = e.target.value
            }}
            onenter={this.addNewGrammar()}
            value={this.newGrammarName}
            />
            <Icon name="plus" intent="positive" onclick={() => {
              if (this.newGrammarName.length > 0) {
                window.$zp.grammar(merge(window.$zp.grammar(), {
                  [this.newGrammarName]: []
                })
                )
                this.newGrammarName = ''
              }
            }}/>
          </div>
          <Button label="Save" type="submit" loading={this.isLoading} fluid="true" intent="primary" onclick={() => {
            this.isLoading = true
            m.request({
              method: 'PUT',
              url: '/api/grammar',
              body: window.$zp.grammar()
            }).then(data => {
              delete data._id
              delete data._rev
              window.$zp.grammar(data)
              this.isLoading = false
            })
          }}/>
        </div>
      )
    } else {
      // if the entity does not have a grammar, provide a way to create one
      if (!window.$zp.editor().metadata ||
          !window.$zp.editor().metadata.grammar) {
        return (
          <div class="grammar-editor wide">
            { this.renderedProtoGrammarTagInputs }
            <div class="new-grammar-prop">
            <label>Add a new grammar property</label>
            <Input placeholder="Grammar property name" intent="positive"
              onchange={(e) => {
                this.newGrammarName = e.target.value
              }}
              onenter={this.addNewGrammar()}
              value={this.newGrammarName}
              />
              <Icon name="plus" intent="positive" onclick={() => {
                if (!window.$zp.editor().metadata) {
                  window.$zp.editor(merge(window.$zp.editor(), { metadata: {} }))
                }
                if (!window.$zp.editor().metadata.grammar) {
                  window.$zp.editor(merge(window.$zp.editor(), {
                    metadata: {
                      ...window.$zp.editor().metadata,
                      grammar: {}
                    }
                  }))
                }
                if (this.newGrammarName.length > 0) {
                  window.$zp.editor(merge(window.$zp.editor(), {
                    metadata: {
                      grammar: merge({
                        ...window.$zp.editor().metadata.grammar,
                        [this.newGrammarName]: []
                      })
                    }
                  }))
                  this.newGrammarName = ''
                }
              }}/>
            </div>
          </div>
        )
      }

      // otherwise, show the entity's editable grammar
      return (
        <div class="grammar-editor wide">
          { this.renderedProtoGrammarTagInputs }
          {Object.keys(window.$zp.editor().metadata.grammar).map((prop, index) => {
            const { isNested, grammarValues, grammarProp } = this.renderProtoGrammarForProp(prop)
  
            return (
              <div class="entity-grammar" key={index}>
                <label>{prop}</label>
                { isNested }
                <TagInput
                  tags={
                    grammarValues.map((val, i) => {
                      return (<Tag key={i}
                        label={val}
                        onRemove={() => {
                          if (window.$zp.editor().metadata.grammar[prop].value) {
                            window.$zp.editor(merge(window.$zp.editor(), {
                              metadata: {
                                grammar: merge({
                                  ...window.$zp.editor().metadata.grammar,
                                  [prop]: {
                                    '...': true,
                                    value: grammarProp.filter(x => x !== val)
                                  }
                                })
                              }
                            }))
                          } else {
                            window.$zp.editor(merge(window.$zp.editor(), {
                              metadata: {
                                grammar: merge({
                                  ...window.$zp.editor().metadata.grammar,
                                  [prop]: grammarProp.filter(x => x !== val)
                                })
                              }
                            }))
                          }
                        }}
                      />)
                    })
                  }
                  onAdd={
                    (e) => {
                      grammarProp.push(e)
                      if (window.$zp.editor().metadata.grammar[prop].value) {
                        window.$zp.editor(merge(window.$zp.editor(), {
                          metadata: {
                            grammar: merge({
                              ...window.$zp.editor().metadata.grammar,
                              [prop]: {
                                '...': true,
                                value: grammarProp
                              }
                            })
                          }
                        }))
                      } else {
                        window.$zp.editor(merge(window.$zp.editor(), {
                          metadata: {
                            grammar: merge({
                              ...window.$zp.editor().metadata.grammar,
                              [prop]: grammarProp
                            })
                          }
                        }))
                      }
                    }
                  }
                />
                <Icon name="x-square" intent="negative" onclick={() => {
                  const old = window.$zp.editor().metadata.grammar
                  delete old[prop]
                  window.$zp.editor(merge(window.$zp.editor(), {
                    metadata: {
                      grammar: old
                    }
                  }))
                  this.renderedProtoGrammarTagInputs = this.renderProtoGrammarTagInputs(this.protoGrammarProps)
                }}/>
              </div>
            )
          })}
          <div class="new-grammar-prop">
            <label>Add a new grammar property</label>
            <Input placeholder="Grammar property name" intent="positive" onenter={this.addNewGrammar()} onchange={(e) => {
              this.newGrammarName = e.target.value
            }}
            value={this.newGrammarName}
            />
            <Icon name="plus" intent="positive" onclick={this.addNewGrammar()}/>
          </div>
        </div>
      )
    }
  }
}
