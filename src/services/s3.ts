import { 
  S3Client, 
  ListObjectsV2Command, 
  GetObjectCommand, 
  PutObjectCommand, 
  CopyObjectCommand, 
  DeleteObjectCommand,
  type CommonPrefix, 
  type _Object 
} from '@aws-sdk/client-s3';
import { type S3Config } from '../components/SettingsModal';

export interface S3File {
  key: string;
  name: string;
  lastModified?: Date;
  size?: number;
  isFolder: boolean;
}

const s3Clients: Record<string, S3Client> = {};

export const getS3Client = (config: S3Config): S3Client => {
  if (!s3Clients[config.id]) {
    // 尝试从 Endpoint 推断 Region (针对 Aliyun)
    let region = config.region;
    if (!region) {
      if (config.endpoint.includes('aliyuncs.com')) {
        // Endpoint 格式通常为: https://oss-cn-beijing.aliyuncs.com
        const match = config.endpoint.match(/oss-([a-z0-9-]+)\.aliyuncs\.com/);
        if (match && match[1]) {
          region = match[1];
        }
      }
    }
    // 默认 Region
    if (!region) {
      region = 'us-east-1';
    }

    s3Clients[config.id] = new S3Client({
      region: region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // 只有在明确勾选时才开启 forcePathStyle
      forcePathStyle: config.forcePathStyle, 
    });
  }
  return s3Clients[config.id];
};

export const listS3Objects = async (
  config: S3Config,
  prefix: string = '',
  delimiter: string = '/'
): Promise<S3File[]> => {
  const client = getS3Client(config);
  const command = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: prefix,
    Delimiter: delimiter,
  });

  try {
    const response = await client.send(command);
    
    const folders: S3File[] = (response.CommonPrefixes || []).map((p: CommonPrefix) => ({
      key: p.Prefix!,
      name: p.Prefix!.slice(prefix.length, -1), // Remove prefix and trailing slash
      isFolder: true,
    }));

    const files: S3File[] = (response.Contents || [])
      .filter((o: _Object) => o.Key !== prefix) // Filter out the folder object itself if it exists
      .map((o: _Object) => ({
        key: o.Key!,
        name: o.Key!.slice(prefix.length),
        lastModified: o.LastModified,
        size: o.Size,
        isFolder: false,
      }));

    return [...folders, ...files];
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    throw error;
  }
};

export const getS3ObjectContent = async (config: S3Config, key: string): Promise<string> => {
  const client = getS3Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);
    const content = await response.Body?.transformToString();
    return content || '';
  } catch (error) {
    console.error('Error getting S3 object content:', error);
    throw error;
  }
};

export const putS3ObjectContent = async (config: S3Config, key: string, content: string): Promise<void> => {
  const client = getS3Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: content,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('Error putting S3 object content:', error);
    throw error;
  }
};

export const downloadS3Object = async (config: S3Config, key: string): Promise<Blob> => {
  const client = getS3Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) throw new Error('Empty response body');
    return new Blob([byteArray.buffer as ArrayBuffer]);
  } catch (error) {
    console.error('Error downloading S3 object:', error);
    throw error;
  }
};

export const renameS3Object = async (config: S3Config, oldKey: string, newKey: string): Promise<void> => {
  const client = getS3Client(config);
  
  try {
    if (oldKey.endsWith('/')) {
      // It's a folder, need to rename all objects with this prefix
      const allObjectsCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: oldKey,
      });
      const response = await client.send(allObjectsCommand);
      const objects = response.Contents || [];

      for (const obj of objects) {
        const oldFileKey = obj.Key!;
        const newFileKey = newKey + oldFileKey.slice(oldKey.length);
        
        // Copy each object
        const copyCommand = new CopyObjectCommand({
          Bucket: config.bucketName,
          CopySource: `${config.bucketName}/${oldFileKey}`,
          Key: newFileKey,
        });
        await client.send(copyCommand);

        // Delete each old object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: oldFileKey,
        });
        await client.send(deleteCommand);
      }
    } else {
      // Single file rename
      const copyCommand = new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${oldKey}`,
        Key: newKey,
      });
      await client.send(copyCommand);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: oldKey,
      });
      await client.send(deleteCommand);
    }
  } catch (error) {
    console.error('Error renaming S3 object:', error);
    throw error;
  }
};

export const uploadS3Object = async (
  config: S3Config, 
  key: string, 
  file: File
): Promise<void> => {
  const client = getS3Client(config);
  
  // Use PutObjectCommand for file upload
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: file,
    ContentType: file.type,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteS3Object = async (config: S3Config, key: string): Promise<void> => {
  const client = getS3Client(config);
  
  try {
    if (key.endsWith('/')) {
      // It's a folder, need to delete all objects with this prefix
      const allObjectsCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: key,
      });
      const response = await client.send(allObjectsCommand);
      const objects = response.Contents || [];

      for (const obj of objects) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: obj.Key!,
        });
        await client.send(deleteCommand);
      }
    } else {
      // Single file delete
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });
      await client.send(deleteCommand);
    }
  } catch (error) {
    console.error('Error deleting S3 object:', error);
    throw error;
  }
};

export const listAllRecursive = async (
  config: S3Config,
  prefix: string
): Promise<string[]> => {
  const client = getS3Client(config);
  const command = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: prefix,
  });

  try {
    const response = await client.send(command);
    return (response.Contents || [])
      .map(o => o.Key!)
      .filter(k => !k.endsWith('/')); // Only files, not folders
  } catch (error) {
    console.error('Error listing recursive files:', error);
    throw error;
  }
};
