'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import RandomCatGif from '@/components/RandomCatGif'
import { RocketIcon } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  password: z.string().min(6, { message: 'Password must be a minimum of 6 characters in length.' }),
})

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubmitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })
  useEffect(() => {
    console.log(isAuthenticated)
    if (isAuthenticated) router.replace('/app')
  }, [isAuthenticated, router])
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
    try {
      setSubmitting(true)
      console.log(values)
      await login(values.email, values.password)
    } catch (e) {
      console.error(e)
      const { dismiss } = toast({
        title: 'Invalid email or password',
        variant: 'destructive',
      })
      setTimeout(dismiss, 3300)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='grid h-screen grid-cols-1 md:grid-cols-2'>
      <div className='col-span-1 h-full p-8 px-12 flex flex-col justify-center space-y-4'>
        <div>
          <h2 className='text-2xl font-medium'>Sign In to MeowwChat</h2>
          <div className='text-sm text-slate-500'>Use your credentials, dummy.</div>
        </div>
        <div className='max-w-lg'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-2'>
              <FormField
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder='john@example.com' {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder='* * * * * * * *' type='password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='text-slate-500'>
                Don't have an account?
                <Link href='/auth/register'>
                  <Button variant={'link'}>Sign Up</Button>
                </Link>
              </div>
              <div className='flex justify-end pt-4'>
                <Button type='submit' size='lg' disabled={isSubmitting}>
                  <RocketIcon />
                  Sign In
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <div className='col-span-1 hidden md:flex flex-col space-y-4 bg-gradient-to-tr from-fuchsia-100 to-fuchsia-800/20 justify-center items-center'>
        <div className='flex flex-col items-center'>
          <h1 className='text-xl font-semibold'>Your wait for awesome Cat inspired AI chat is finally over!</h1>
        </div>
        <RandomCatGif />
      </div>
    </div>
  )
}
