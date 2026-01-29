import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function Page() {
  return (
     <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-6 rounded-xl">
                    <SignUp 
                      routing='path' 
                      path='/signup' 
                      redirectUrl="/redirect"
                      afterSignUpUrl="/redirect"
/>
                </div>                
            </div>
  )
}