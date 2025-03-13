"use client";

import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

type Props = {
    children: React.ReactNode;
};

function GoogleRecaptchaClientProvider({ children }: Props) {
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
            scriptProps={{
                async: true,
                defer: false,
                appendTo: "head"
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}

export default GoogleRecaptchaClientProvider;