import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  const [step, setStep] = useState('questionnaire');
  const [formData, setFormData] = useState({
    gender: '',
    occasion: '',
    budget: '',
    silhouette: '',
    height: '',
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    avoidColors: ''
  });

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState([]);

  // 🤖 Détection automatique du genre selon l'URL
  const detectGenderFromUrl = (url) => {
    const lowerUrl = url.toLowerCase();
    const femaleKeywords = ['femme', 'women', 'woman', 'robe', 'skirt', 'jupe', 'bikini', 'crop-top', 'escarpins', 'bottes'];
    const maleKeywords = ['homme', 'men', 'man', 'costume', 'boxer', 'cravate', 'bottes'];

    if (femaleKeywords.some(keyword => lowerUrl.includes(keyword))) return 'Femme';
    if (maleKeywords.some(keyword => lowerUrl.includes(keyword))) return 'Homme';
    return 'Unisexe';
  };

  const fetchArticles = async () => {
    setLoading(true);
    let query = supabase.from('articles').select('*');
    
    if (formData.gender) {
      query = query.or(`gender.eq.${formData.gender},gender.eq.Unisexe`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } else {
      setCatalog(data || []);
    }
    setLoading(false);
  };

  const handleSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = async () => {
    if (!formData.gender || !formData.occasion || !formData.budget) {
      alert("Merci de répondre aux questions obligatoires (*)");
      return;
    }
    await fetchArticles();
    setStep('swipe');
  };

  const handleSwipe = (liked) => {
    const currentItem = catalog[currentIndex];
    if (liked) {
      setLikedItems([...likedItems, currentItem]);
    }

    if (currentIndex + 1 < catalog.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep('results');
    }
  };

  const getRecommendedSize = (sizeChart) => {
    if (!sizeChart || !Array.isArray(sizeChart)) return 'M (Standard)';
    
    const userChest = parseFloat(formData.chest);
    const userWaist = parseFloat(formData.waist);

    if (!userChest && !userWaist) return 'M (Conseillé)';

    for (let entry of sizeChart) {
      const matchChest = !userChest || (userChest >= entry.chest_min && userChest <= entry.chest_max);
      const matchWaist = !userWaist || (userWaist >= entry.waist_min && userWaist <= entry.waist_max);
      if (matchChest || matchWaist) {
        return entry.size;
      }
    }
    return 'M';
  };

  // --- Logique intelligente sans doublon ---
  const generateSmartOutfits = () => {
    if (likedItems.length === 0) return [];

    const isWoman = formData.gender === 'Femme';

    return likedItems.slice(0, 3).map((item, index) => {
      const nameLower = (item.name || '').toLowerCase();
      
      const isBootOrShoe = nameLower.includes('bottes') || nameLower.includes('botte') || nameLower.includes('chaussure') || nameLower.includes('escarpin') || nameLower.includes('sneakers');
      const isBottom = nameLower.includes('pantalon') || nameLower.includes('jean') || nameLower.includes('jupe') || nameLower.includes('trousers') || nameLower.includes('short');

      let smartComplements = [];

      if (isBootOrShoe) {
        smartComplements = isWoman ? [
          { type: "Bas", desc: "Pantalon tailleur droit ou jean wide-leg" },
          { type: "Haut", desc: "Top minimaliste ou chemisier fluide" },
          { type: "Accessoires", desc: "Sac à main assorti & bijoux dorés" }
        ] : [
          { type: "Bas", desc: "Chino ajusté ou jean brut" },
          { type: "Haut", desc: "T-shirt basique ou chemise casual" },
          { type: "Accessoires", desc: "Ceinture en cuir & montre" }
        ];
      } else if (isBottom) {
        smartComplements = isWoman ? [
          { type: "Haut", desc: "Chemisier blanc fluide ou crop top ajusté" },
          { type: "Chaussures", desc: "Escarpins élégants ou mocassins en cuir" },
          { type: "Accessoires", desc: "Sac structuré & ceinture fine" }
        ] : [
          { type: "Haut", desc: "T-shirt blanc en coton ou polo élégant" },
          { type: "Chaussures", desc: "Sneakers minimalistes blanches" },
          { type: "Accessoires", desc: "Montre en acier & ceinture en cuir" }
        ];
      } else {
        smartComplements = isWoman ? [
          { type: "Bas", desc: "Pantalon taille haute noir ou jean assorti" },
          { type: "Haut / Dessous", desc: "Top blanc minimaliste ou satiné" },
          { type: "Chaussures", desc: "Boots élégantes ou escarpins" },
          { type: "Accessoires", desc: "Bijoux dorés & sac bandoulière" }
        ] : [
          { type: "Bas", desc: "Pantalon chino noir ou jean brut" },
          { type: "Haut / Dessous", desc: "T-shirt blanc basique ou chemise" },
          { type: "Chaussures", desc: "Sneakers propres ou bottines en cuir" },
          { type: "Accessoires", desc: "Ceinture noire & montre bracelet" }
        ];
      }

      return {
        id: index + 1,
        name: `Look ${index + 1} : Autour de ton ${item.name}`,
        vibe: `Créé par Léa pour ton style (${formData.occasion || 'Quotidien'})`,
        heroPiece: item,
        complements: smartComplements
      };
    });
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMessage('');

    const autoGender = detectGenderFromUrl(productUrl);

    try {
      const newArticle = {
        name: productName,
        brand: productBrand,
        price: parseFloat(productPrice) || 0,
        category: "Vêtement / Mode",
        image_url: imageUrl,
        buy_link: productUrl,
        gender: autoGender,
        silhouette_fit: "H",
        size_chart: [
          { size: "S", chest_min: 80, chest_max: 88, waist_min: 60, waist_max: 68 },
          { size: "M", chest_min: 88, chest_max: 96, waist_min: 68, waist_max: 76 },
          { size: "L", chest_min: 96, chest_max: 104, waist_min: 76, waist_max: 84 }
        ]
      };

      const { error } = await supabase.from('articles').insert([newArticle]);
      if (error) throw error;

      setAdminMessage(`✨ "${productName}" (${productPrice} €) enregistré avec succès !`);
      setProductName('');
      setProductBrand('');
      setProductPrice('');
      setProductUrl('');
      setImageUrl('');
    } catch (err) {
      setAdminMessage('Erreur : ' + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const finalOutfits = generateSmartOutfits();

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          {isAdminMode ? '← Retour à l\'application' : '⚙️ Mode Admin (Ajout)'}
        </button>
      </div>

      {isAdminMode ? (
        <div style={styles.card}>
          <h2>🛍️ Ajout d'un Article au Catalogue</h2>
          <form onSubmit={handleAddArticle} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={styles.label}>Nom de l'article :</label>
              <input type="text" placeholder="Ex: Wide-Leg Smart Trousers" value={productName} onChange={(e) => setProductName(e.target.value)} required style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Marque :</label>
              <input type="text" placeholder="Ex: Stradivarius" value={productBrand} onChange={(e) => setProductBrand(e.target.value)} required style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Prix (€) :</label>
              <input type="number" step="0.01" placeholder="Ex: 29.99" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Lien de la page produit :</label>
              <input type="url" placeholder="https://..." value={productUrl} onChange={(e) => setProductUrl(e.target.value)} required style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Lien direct de l'image (URL photo) :</label>
              <input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required style={styles.input} />
            </div>
            <button type="submit" disabled={adminLoading} style={styles.submitBtn}>
              {adminLoading ? 'Enregistrement...' : 'Ajouter au catalogue Supabase 🚀'}
            </button>
          </form>
          {adminMessage && <p style={{ marginTop: '15px', fontWeight: 'bold', color: adminMessage.includes('Erreur') ? 'red' : 'green' }}>{adminMessage}</p>}
        </div>
      ) : (
        <>
          {step === 'results' && (
            <div>
              <h1 style={styles.title}>✨ Looks Intelligents par Léa (Max 3)</h1>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                L'Agent Léa a évité les doublons et a complété logiquement tes tenues pour ton profil <strong>{formData.gender}</strong> :
              </p>

              {likedItems.length === 0 ? (
                <div style={styles.card}>
                  <p style={{ textAlign: 'center', margin: '20px 0' }}>Aucun article liké. Recommence pour voir tes looks !</p>
                </div>
              ) : (
                finalOutfits.map((outfit) => {
                  const heroSize = getRecommendedSize(outfit.heroPiece?.size_chart);
                  return (
                    <div key={outfit.id} style={styles.outfitCard}>
                      <h3 style={{ color: '#007AFF', marginBottom: '4px' }}>{outfit.name}</h3>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>{outfit.vibe}</p>
                      
                      <div style={styles.realItemContainer}>
                        <img src={outfit.heroPiece.image_url} alt={outfit.heroPiece.name} style={styles.realItemImg} />
                        <div style={styles.realItemInfo}>
                          <span style={styles.tagPiece}>TA PIÈCE SÉLECTIONNÉE ❤️</span>
                          <h4>{outfit.heroPiece.name}</h4>
                          <p style={{ color: '#666', margin: '2px 0' }}>{outfit.heroPiece.brand} — <strong>{outfit.heroPiece.price} €</strong></p>
                          <span style={styles.miniTag}>Taille conseillée : <strong>{heroSize}</strong></span>
                          {outfit.heroPiece.buy_link && (
                            <a href={outfit.heroPiece.buy_link} target="_blank" rel="noreferrer" style={styles.buyLink}>
                              Voir l'article d'origine →
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>👗 Suggestions complémentaires de Léa :</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {outfit.complements.map((comp, idx) => (
                            <div key={idx} style={styles.complementBox}>
                              ✨ <strong>{comp.type} :</strong> {comp.desc}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <button style={styles.submitBtn} onClick={() => { setStep('questionnaire'); setCurrentIndex(0); setLikedItems([]); }}>
                Recommencer le test
              </button>
            </div>
          )}

          {step === 'swipe' && (
            <div>
              {loading ? (
                <h2 style={{ textAlign: 'center' }}>Chargement des articles pour {formData.gender}...</h2>
              ) : catalog.length === 0 ? (
                <div>
                  <h2 style={{ textAlign: 'center' }}>Aucun article disponible pour {formData.gender}</h2>
                  <p style={{ textAlign: 'center' }}>Passe en mode admin pour en ajouter !</p>
                  <button style={styles.submitBtn} onClick={() => setStep('questionnaire')}>Retour</button>
                </div>
              ) : (
                <div>
                  <h1 style={styles.title}>Swipe ta sélection ({formData.gender})</h1>
                  <p style={{ textAlign: 'center', color: '#666' }}>Article {currentIndex + 1} sur {catalog.length}</p>

                  <div style={styles.swipeCard}>
                    <img src={catalog[currentIndex].image_url} alt={catalog[currentIndex].name} style={styles.swipeImage} />
                    <h2 style={styles.itemTitle}>{catalog[currentIndex].name}</h2>
                    <p style={{ color: '#888', margin: '0 0 5px 0' }}>{catalog[currentIndex].brand}</p>
                    <span style={styles.badge}>{catalog[currentIndex].category} • {catalog[currentIndex].price} €</span>

                    <div style={styles.swipeButtons}>
                      <button style={{ ...styles.swipeBtn, backgroundColor: '#FF3B30' }} onClick={() => handleSwipe(false)}>❌ Je passe</button>
                      <button style={{ ...styles.swipeBtn, backgroundColor: '#34C759' }} onClick={() => handleSwipe(true)}>❤️ J'aime</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'questionnaire' && (
            <div>
              <h1 style={styles.title}>Assistant Style & Look</h1>
              
              <div style={styles.card}>
                <h3>1. Quelle est ta silhouette / genre ? *</h3>
                <div style={styles.btnGroup}>
                  {['Femme', 'Homme', 'Unisexe'].map((item) => (
                    <button 
                      key={item}
                      style={{ ...styles.button, backgroundColor: formData.gender === item ? '#007AFF' : '#f0f0f0', color: formData.gender === item ? '#fff' : '#000' }}
                      onClick={() => handleSelect('gender', item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h3>2. Pour quelle occasion cherches-tu un look ? *</h3>
                <div style={styles.btnGroup}>
                  {['Quotidien / Casual', 'Travail / Business', 'Soirée / Sortie', 'Sport / Streetwear'].map((item) => (
                    <button 
                      key={item}
                      style={{ ...styles.button, backgroundColor: formData.occasion === item ? '#007AFF' : '#f0f0f0', color: formData.occasion === item ? '#fff' : '#000' }}
                      onClick={() => handleSelect('occasion', item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h3>3. Quel est ton budget ? *</h3>
                <div style={styles.btnGroup}>
                  {['€ (Petit budget)', '€€ (Milieu de gamme)', '€€€ (Luxe)'].map((item) => (
                    <button 
                      key={item}
                      style={{ ...styles.button, backgroundColor: formData.budget === item ? '#007AFF' : '#f0f0f0', color: formData.budget === item ? '#fff' : '#000' }}
                      onClick={() => handleSelect('budget', item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h3>4. Quel est ton type de silhouette ? (Optionnel)</h3>
                <div style={styles.btnGroup}>
                  {['A (Hanches larges)', 'V (Épaules larges)', 'H (Rectiligne)', 'O (Ronde)', 'X / 8 (Symétrique)'].map((item) => (
                    <button 
                      key={item}
                      style={{ ...styles.button, backgroundColor: formData.silhouette === item ? '#007AFF' : '#f0f0f0', color: formData.silhouette === item ? '#fff' : '#000' }}
                      onClick={() => handleSelect('silhouette', item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h3>5. Mensurations précises (Optionnel)</h3>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Hauteur (cm)</label>
                    <input type="number" placeholder="175" style={styles.input} value={formData.height} onChange={(e) => handleSelect('height', e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Poids (kg)</label>
                    <input type="number" placeholder="68" style={styles.input} value={formData.weight} onChange={(e) => handleSelect('weight', e.target.value)} />
                  </div>
                </div>
                <div style={{ ...styles.row, marginTop: '10px' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Poitrine (cm)</label>
                    <input type="number" placeholder="90" style={styles.input} value={formData.chest} onChange={(e) => handleSelect('chest', e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Taille (cm)</label>
                    <input type="number" placeholder="72" style={styles.input} value={formData.waist} onChange={(e) => handleSelect('waist', e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Hanches (cm)</label>
                    <input type="number" placeholder="96" style={styles.input} value={formData.hips} onChange={(e) => handleSelect('hips', e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h3>6. Couleurs à éviter ? (Optionnel)</h3>
                <input type="text" placeholder="Ex: Jaune, Rose..." style={styles.input} value={formData.avoidColors} onChange={(e) => handleSelect('avoidColors', e.target.value)} />
              </div>

              <button style={styles.submitBtn} onClick={handleNext}>
                Lancer le Swipe & Composer mes tenues →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  btnGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' },
  button: { padding: '8px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  row: { display: 'flex', gap: '10px' },
  inputGroup: { flex: 1 },
  label: { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' },
  swipeCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', textAlign: 'center' },
  swipeImage: { width: '100%', height: '350px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' },
  itemTitle: { fontSize: '20px', margin: '10px 0 5px 0' },
  badge: { display: 'inline-block', backgroundColor: '#eee', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#555', marginBottom: '20px' },
  swipeButtons: { display: 'flex', gap: '16px', justifyContent: 'center' },
  swipeBtn: { flex: 1, padding: '14px', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  outfitCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  realItemContainer: { display: 'flex', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '12px', gap: '12px', border: '1px solid #e5e7eb', alignItems: 'center' },
  realItemImg: { width: '80px', height: '100px', objectFit: 'cover', borderRadius: '8px' },
  realItemInfo: { flex: 1 },
  tagPiece: { fontSize: '10px', backgroundColor: '#000', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  complementBox: { backgroundColor: '#f3f4f6', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid #007AFF', color: '#333' },
  miniTag: { backgroundColor: '#eef2ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginTop: '4px', display: 'inline-block' },
  buyLink: { display: 'block', fontSize: '12px', color: '#007AFF', textDecoration: 'none', fontWeight: 'bold', marginTop: '4px' }
};
