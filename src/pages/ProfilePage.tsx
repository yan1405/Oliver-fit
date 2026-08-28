import { useState } from 'react'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { List, ListItem } from '../components/ui/List'
import { supabase } from '../lib/supabase'

export function ProfilePage() {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <Card>
          <div className="mb-4 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
          <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
          <h1 className="font-display text-heading-1 font-bold">Perfil</h1>
        </Card>

        <h2 className="mb-2 mt-8 px-4 text-overline font-semibold uppercase text-muted-foreground">Conta</h2>
        <List>
          <ListItem label="Sair da conta" detail="Encerra a sessão neste dispositivo" onClick={() => setConfirmingSignOut(true)} />
        </List>
      </div>

      <BottomSheet open={confirmingSignOut} title="Sair da conta?" onClose={() => setConfirmingSignOut(false)}>
        <p className="text-body text-muted-foreground">Seus registros continuarão salvos.</p>
        <div className="mt-6 grid gap-3">
          <Button type="button" onClick={() => supabase.auth.signOut()}>Sair</Button>
          <Button type="button" variant="secondary" onClick={() => setConfirmingSignOut(false)}>Cancelar</Button>
        </div>
      </BottomSheet>
    </main>
  )
}
