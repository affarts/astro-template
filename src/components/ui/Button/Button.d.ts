import type { HTMLTag, Polymorphic } from 'astro/types'

export type ButtonProps<Tag extends HTMLTag> = Polymorphic<
  { as: Tag } & {
    form?: string // Which form should submit
    type?: string
    text?: string
    className?: string
    main?: boolean // If you are using custom button set false
    size?: 'xs' | 'sm' | 'sm-2' | 'md'
    mods?: string[]
    spinner?: boolean
    modal?: string
    icon?: string
    iconPosition?: 'left' | 'right'
    external?: boolean
  }
>
