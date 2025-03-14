import Image from 'next/image'
import { useRef } from 'react'

const GIF_NAMES = [
  'Cat_Book',
  'cat_dragging',
  'Cat_Internet',
  'cat_love',
  'Cats_Hugging',
  'Frustrated_Cat',
  'In_Love_Cat',
  'Scared_Cat',
  'Surprised_Cat',
  'Top_Hat_Reaction',
  'Vibing_White_Cat',
]
export default function RandomCatGif() {
  const random = useRef(Math.floor(Math.random() * 10))
  return (
    <Image
      src={`/gifs/${GIF_NAMES[random.current]}.gif`}
      alt='random CAT gif'
      className='h-64 w-64 rounded-md'
      width={64}
      height={64}
    />
  )
}
