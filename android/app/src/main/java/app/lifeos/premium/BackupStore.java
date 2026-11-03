package app.lifeos.premium;
import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;

/** Encrypted working copy for background backups. The web storage is separate. */
public final class BackupStore {
    private BackupStore(){}
    public static SharedPreferences prefs(Context c){return c.getSharedPreferences("lifeos_native",Context.MODE_PRIVATE);}
    private static SecretKey key() throws Exception{
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
        if(!ks.containsAlias("lifeos.snapshot.v5")){
            KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            gen.init(new KeyGenParameterSpec.Builder("lifeos.snapshot.v5",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());gen.generateKey();
        }
        return (SecretKey)ks.getKey("lifeos.snapshot.v5",null);
    }
    public static synchronized void put(Context c,String name,String data)throws Exception{
        if(data==null||data.getBytes(StandardCharsets.UTF_8).length>20_000_000)throw new Exception("Copie trop volumineuse (20 Mo maximum).");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
        String value=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(cipher.doFinal(data.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
        if(!prefs(c).edit().putString(name,value).commit())throw new Exception("Copie locale impossible.");
    }
    public static synchronized String get(Context c,String name)throws Exception{
        String s=prefs(c).getString(name,null);if(s==null)throw new Exception("Aucune copie disponible. Ouvre LifeOS puis enregistre tes données.");
        String[] parts=s.split(":",2);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
    }
    public static void status(Context c,String s){prefs(c).edit().putString("cloudStatus",s).apply();}
}
