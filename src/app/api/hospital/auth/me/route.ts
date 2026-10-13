import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionByToken, getAllHospitalUsers } from '@/lib/db/hospitalAuthStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('cuidae_hospital_session')?.value;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    const token = tokenCookie || authHeader;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        hospital: null,
      });
    }

    const session = getSessionByToken(token);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        hospital: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      hospital: session,
    });
  } catch (error: any) {
    console.error('Erro ao verificar sessão hospitalar:', error);
    return NextResponse.json(
      { authenticated: false, hospital: null, error: error.message },
      { status: 500 }
    );
  }
}
