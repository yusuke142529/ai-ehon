export async function verifyRecaptcha(token: string | null): Promise<boolean> {
    if (!token) return false;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY!;
    const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
        { method: "POST" }
    );
    const data = await response.json();
    return data.success === true;
}
