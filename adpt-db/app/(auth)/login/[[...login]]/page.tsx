import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-6 rounded-xl">
                <SignIn routing='path' path='/login' forceRedirectUrl='/dashboard'/>
            </div>
        </div>

    )
}