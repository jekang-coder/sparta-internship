export default function Footer() {
  return (
    <footer
      style={{
        padding: '24px 40px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13, color: '#BBBBBB' }}>
        © 2026 팀스파르타 내부 서비스
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#BBBBBB' }}>
        <span style={{ color: '#FA0030' }}>SPARTA</span> INTERVIEW TRACKER
      </span>
    </footer>
  );
}
