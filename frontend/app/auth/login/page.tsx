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

const formSchema = z.object({
  username: z.string().email({ message: 'Username must be a valid email address' }),
  password: z.string().min(6, { message: 'Password must be a minimum of 6 characters in length.' }),
})

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubmitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '' },
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
      await login(values.username, values.password)
    } catch (e) {
      console.error(e)
      const { dismiss } = toast({
        title: 'Invalid username or password',
        variant: 'destructive',
      })
      setTimeout(dismiss, 3300)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='grid h-screen grid-cols-1 md:grid-cols-2'>
      <div className='col-span-1 h-full p-8 flex flex-col justify-center space-y-4'>
        <div>
          <h1 className='text-2xl font-medium'>Login to MeowwChat</h1>
          <div className='text-sm text-slate-500'>Use your credentials.</div>
        </div>
        <div className='max-w-lg'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
              <FormField
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='user@example.com' {...field} autoFocus />
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
              <div className='flex justify-end'>
                <Button type='submit' size='lg' disabled={isSubmitting}>
                  Get Access
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <div className='col-span-1 hidden md:flex bg-gradient-to-tr from-fuchsia-100 to-fuchsia-800/20 justify-center items-center'>
        <RandomCatGif />
      </div>
    </div>
  )
}
