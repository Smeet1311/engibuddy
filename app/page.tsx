'use client'

import Link from 'next/link'
import { MessageCircle, SquarePen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">EngiBuddy</h1>
          <p className="text-slate-600 text-center mb-8">Choose your mode to get started</p>

          <div className="space-y-4">
            <Link
              href="/guidance"
              className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-semibold text-slate-900">Guidance Mode</div>
                <div className="text-sm text-slate-600">Step-by-step design guidance</div>
              </div>
            </Link>

            <Link
              href="/review"
              className="flex items-center gap-3 p-4 border-2 border-amber-200 rounded-lg hover:bg-amber-50 transition"
            >
              <SquarePen className="w-6 h-6 text-amber-600" />
              <div>
                <div className="font-semibold text-slate-900">Review Mode</div>
                <div className="text-sm text-slate-600">Review and refine your work</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
