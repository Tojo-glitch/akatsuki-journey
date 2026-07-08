import React, { useState, useEffect, useRef } from 'react'
import { getComments, addComment, markCommentsRead, uploadChartImage } from '../../lib/api'
import { Badge, fmtDate } from '../UI'

export default function CommentSection({ tradeId, isOwner, isReviewer, ownerToken, reviewerToken, toast, tradeChartUrl }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // สถานะพิกัดปักหมุดบนภาพ
  const [pinCoords, setPinCoords] = useState(null)
  const imageRef = useRef(null)

  // ── ซ่อมแซมระบบตรวจจับ Token บิดเบือนของตัวกรองและอาจารย์ ──
  const activeReviewerToken = reviewerToken || sessionStorage.getItem('tj_reviewer_token')
  const activeToken = isOwner ? ownerToken : activeReviewerToken

  const load = async () => {
    setLoading(true)
    const data = await getComments(tradeId)
    setComments(data)
    setLoading(false)

    if (isOwner && ownerToken && data.some(c => !c.is_read)) {
      await markCommentsRead(ownerToken, tradeId)
    }
  }

  useEffect(() => { load() }, [tradeId])

  const handleImageClick = (e) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPinCoords({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
    toast('Spot pinned on chart!')
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const res = await uploadChartImage(file)
    if (res.success && res.url) {
      setImageUrl(res.url)
      toast('Attachment uploaded')
    } else {
      toast('Upload failed', 'error')
    }
    setUploading(false)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        handleFileUpload(file)
        e.preventDefault()
        break
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    
    setSubmitting(true)
    const res = await addComment(
      activeToken, 
      tradeId, 
      isOwner ? 'Owner (Trader)' : 'Mentor Feedback', 
      content, 
      imageUrl, 
      linkUrl,
      null,
      'Pending',
      pinCoords ? pinCoords.x : null,
      pinCoords ? pinCoords.y : null
    )
    if (res?.success) {
      toast('Feedback submitted')
      setContent('')
      setImageUrl('')
      setLinkUrl('')
      setPinCoords(null)
      load()
    } else {
      toast(res?.message || 'Failed to submit', 'error')
    }
    setSubmitting(false)
  }

  const rootComments = comments.filter(c => !c.parent_id)

  return (
    <div style={{ marginTop: 12, padding: '16px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
        Interactive Discussion & Chart Pinpoint Analysis
      </div>

      {tradeChartUrl && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
            Click image below to pinpoint critical entry error spot
          </div>
          <div style={{ position: 'relative', display: 'inline-block', cursor: isReviewer ? 'crosshair' : 'default' }}>
            <img 
              ref={imageRef}
              src={tradeChartUrl} 
              alt="Trading layout" 
              onClick={isReviewer ? handleImageClick : undefined}
              style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: 4, border: '1px solid var(--border)' }}
            />
            
            {comments.filter(c => c.pin_x && c.pin_y).map((c, idx) => (
              <div 
                key={c.id}
                style={{
                  position: 'absolute',
                  left: `${c.pin_x}%`,
                  top: `${c.pin_y}%`,
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--yellow)', border: '2px solid #000',
                  color: '#000', fontSize: '10px', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 12px rgba(255, 200, 87, 0.6)'
                }}
                title={`${c.author_name}: ${c.content}`}
              >
                {idx + 1}
              </div>
            ))}

            {pinCoords && (
              <div 
                style={{
                  position: 'absolute',
                  left: `${pinCoords.x}%`,
                  top: `${pinCoords.y}%`,
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--green)', border: '2px solid #000',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 12px rgba(38, 217, 160, 0.8)'
                }}
              />
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 40, borderRadius: 4 }} />
      ) : rootComments.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: 11, padding: '8px 0' }}>No critique or threads initiated for this record.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {rootComments.map((c, idx) => {
            const replies = comments.filter(r => r.parent_id === c.id)
            return (
              <div key={c.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {c.pin_x && c.pin_y && (
                    <span style={{ background: 'var(--yellow)', color: '#000', fontSize: 10, fontWeight: 900, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      {idx + 1}
                    </span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{c.author_name}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-dark)' }}>{fmtDate(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.content}</p>
                    
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11 }}>
                      {c.image_url && <a href={c.image_url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'underline' }}>View Screenshot</a>}
                      {c.image_url && c.link_url && <span>|</span>}
                      {c.link_url && <a href={c.link_url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'underline' }}>Reference analysis</a>}
                    </div>
                  </div>
                </div>

                {replies.map(r => (
                  <div key={r.id} style={{ marginLeft: 32, marginTop: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.author_name.includes('Owner') ? 'var(--blue)' : 'var(--green)' }}>{r.author_name}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-dark)' }}>{fmtDate(r.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>{r.content}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {(isReviewer || isOwner) && activeToken ? (
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>
            {isOwner ? 'Trader Response' : 'Mentor Critique Output'}
          </div>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)}
            placeholder={isOwner ? "Explain trade logic, reply to critique, or verify issue resolved..." : "Provide critique. Click on the image above to pinpoint errors."} 
            style={{ height: 60 }}
            required
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {pinCoords && (
              <button className="btn-ghost" type="button" onClick={() => setPinCoords(null)} style={{ fontSize: 10, padding: '4px 10px' }}>
                Clear Pin Coordinate
              </button>
            )}
            <button className="btn-primary" type="submit" disabled={submitting || uploading} style={{ padding: '6px 14px', fontSize: 10 }}>
              {submitting ? 'RECORDING...' : 'POST COMMENT'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}