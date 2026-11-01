package app.lifeos.premium;
import android.content.Context;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.common.api.Scope;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.text.SimpleDateFormat;

/** Uses only the appDataFolder scope. Tokens remain in native memory. */
public final class DriveFiles {
    public static final String SCOPE="https://www.googleapis.com/auth/drive.appdata";
    private static final String NAME="lifeos-backup-v5.json";
    public static AuthorizationRequest request(){return AuthorizationRequest.builder().setRequestedScopes(Collections.singletonList(new Scope(SCOPE))).build();}
    public static String readLimited(InputStream in)throws IOException{if(in==null)throw new IOException("Fichier inaccessible");ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(out.size()+n>20_000_000)throw new IOException("Fichier trop volumineux (20 Mo)");out.write(b,0,n);}return out.toString(StandardCharsets.UTF_8.name());}
    private static String http(String token,String method,String url,String body,String contentType)throws Exception{
        if(token==null||token.isEmpty())throw new IOException("Autorisation Google absente. Reconnecte ton compte.");
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(20000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setRequestMethod(method);c.setRequestProperty("Authorization","Bearer "+token);
        try{if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",contentType);try(OutputStream out=c.getOutputStream()){out.write(body.getBytes(StandardCharsets.UTF_8));}}
            int code=c.getResponseCode();if(code<200||code>=300){if(code==401)throw new IOException("Autorisation expirée : reconnecte Google Drive.");if(code==403)throw new IOException("Accès Drive refusé. Vérifie l’API Drive, OAuth et l’espace disponible.");throw new IOException("Google Drive indisponible (HTTP "+code+").");}
            try(InputStream in=c.getInputStream()){return readLimited(in);}
        }finally{c.disconnect();}
    }
    private static String find(String token)throws Exception{
        String q=URLEncoder.encode("name = '"+NAME+"' and trashed = false",StandardCharsets.UTF_8.name());
        JSONObject o=new JSONObject(http(token,"GET","https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1&orderBy=modifiedTime%20desc&fields=files(id)&q="+q,null,null));
        JSONArray files=o.optJSONArray("files");return files==null||files.length()==0?null:files.getJSONObject(0).getString("id");
    }
    public static synchronized void backup(Context ctx,String token)throws Exception{
        if(!BackupStore.prefs(ctx).getBoolean("drive",false))throw new IOException("Connexion Google désactivée.");
        String data=BackupStore.get(ctx,"snapshot");new JSONObject(data);String id=find(token);
        if(id==null){String boundary="lifeos_"+java.util.UUID.randomUUID();JSONObject meta=new JSONObject().put("name",NAME).put("mimeType","application/json").put("parents",new JSONArray().put("appDataFolder"));String body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+meta+"\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+data+"\r\n--"+boundary+"--\r\n";http(token,"POST","https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",body,"multipart/related; boundary="+boundary);
        }else http(token,"PATCH","https://www.googleapis.com/upload/drive/v3/files/"+URLEncoder.encode(id,"UTF-8")+"?uploadType=media",data,"application/json; charset=UTF-8");
        BackupStore.prefs(ctx).edit().putLong("lastCloudAt",System.currentTimeMillis()).putString("cloudStatus","Sauvegarde réussie").apply();
    }
    public static synchronized String restore(String token)throws Exception{String id=find(token);if(id==null)throw new IOException("Aucune sauvegarde LifeOS V5 dans ce compte Google.");return http(token,"GET","https://www.googleapis.com/drive/v3/files/"+URLEncoder.encode(id,"UTF-8")+"?alt=media",null,null);}
    private static long exportedAt(String data)throws Exception{
        String value=new JSONObject(data).optString("exportedAt","");
        if(value.isEmpty())return 0;
        SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX",Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));Date parsed=format.parse(value);
        return parsed==null?0:parsed.getTime();
    }
    private static long stateUpdatedAt(String data)throws Exception{
        JSONObject o=new JSONObject(data);
        return o.has("stateUpdatedAt")?o.optLong("stateUpdatedAt",0):exportedAt(data);
    }
    /** Explicit two-way sync: newer remote data is returned for user-confirmed restore; otherwise local data is uploaded. */
    public static synchronized String sync(Context ctx,String token)throws Exception{
        if(!BackupStore.prefs(ctx).getBoolean("drive",false))throw new IOException("Connecte Google Drive d’abord.");
        String local=BackupStore.get(ctx,"snapshot");new JSONObject(local);long localTime=stateUpdatedAt(local);
        String id=find(token);
        if(id==null){backup(ctx,token);BackupStore.status(ctx,"Synchronisation terminée : copie locale envoyée sur Drive");return null;}
        String remote=http(token,"GET","https://www.googleapis.com/drive/v3/files/"+URLEncoder.encode(id,"UTF-8")+"?alt=media",null,null);
        new JSONObject(remote);
        long remoteTime=stateUpdatedAt(remote);
        if(remoteTime>localTime){
            BackupStore.put(ctx,"restore",remote);
            BackupStore.status(ctx,"Drive contient une copie plus récente ; restauration à confirmer");
            return remote;
        }
        if(localTime>remoteTime){backup(ctx,token);BackupStore.status(ctx,"Synchronisation terminée : copie locale plus récente envoyée sur Drive");}
        else BackupStore.status(ctx,"Synchronisation terminée : les deux copies sont à jour");
        return null;
    }
}
