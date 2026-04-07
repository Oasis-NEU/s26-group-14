import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSemester(userId) {
  const [semester, setSemester] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchActiveSemester()
  }, [userId])

  async function fetchActiveSemester() {
    setLoading(true)
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (data) {
      setSemester(data)
      fetchEntries(data.id)
    } else {
      setSemester(null)
      setEntries([])
      setLoading(false)
    }
  }

  async function fetchEntries(semesterId) {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('semester_id', semesterId)
      .order('date', { ascending: true })

    setEntries(data || [])
    setLoading(false)
  }

  async function createSemester(name, startDate, endDate, budget) {
    // deactivate any existing active semester first
    await supabase
      .from('semesters')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    const { data, error } = await supabase
      .from('semesters')
      .insert({ user_id: userId, name, start_date: startDate, end_date: endDate, budget, is_active: true })
      .select()
      .single()

    if (data) {
      setSemester(data)
      setEntries([])
    }
    return { data, error }
  }

  async function addEntry(date, amount, label) {
    if (!semester) return
    const { data, error } = await supabase
      .from('entries')
      .insert({ user_id: userId, semester_id: semester.id, date, amount, label })
      .select()
      .single()

    if (data) setEntries(prev => [...prev, data].sort((a,b) => a.date.localeCompare(b.date)))
    return { data, error }
  }

  async function deleteEntry(id) {
    await supabase.from('entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function archiveSemester(name) {
    if (!semester) return
    await supabase
      .from('semesters')
      .update({ is_active: false, name })
      .eq('id', semester.id)
    setSemester(null)
    setEntries([])
  }

  return { semester, entries, loading, createSemester, addEntry, deleteEntry, archiveSemester, refetch: fetchActiveSemester }
}