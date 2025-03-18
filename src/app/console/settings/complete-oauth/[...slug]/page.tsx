"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PiSpinner } from "react-icons/pi";
import { completeOAuth } from "../../../actions";

export default function CompleteOauth() {

    const router = useRouter()
    const searchParams = useSearchParams()
    const params = useParams()

    useEffect(() => {
        if (params.slug) {
            init()
        }
    }, [params.slug])

    const init = async () => {
        const code = searchParams.get("code")
        if (!code) {
            router.push("/console/settings")
            return
        }
        await completeOAuth(params.slug as string, code)
        router.push("/console/settings")
    }

    return <div className="h-screen w-screen flex items-center justify-center"><PiSpinner className="text-2xl animate-spin" /></div>
}
